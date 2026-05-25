import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  normalizeTopLevelEvent,
  sanitizeJsonValue,
  type WorkflowStatus,
} from "@/lib/validation";
import { workflowAdapters } from "@/lib/workflows/adapters";
import type { WorkflowAdapter } from "@/lib/workflows/types";

type GenericWorkflowAdapter = WorkflowAdapter<Record<string, unknown>>;

const adapterRegistry = new Map(
  workflowAdapters.map((adapter) => [
    `${adapter.source}:${adapter.eventType}`,
    adapter as GenericWorkflowAdapter,
  ]),
);

export const eventInclude = {
  actions: {
    orderBy: {
      created_at: "asc",
    },
  },
  review_queue_items: {
    orderBy: {
      created_at: "asc",
    },
  },
  audit_logs: {
    orderBy: {
      created_at: "asc",
    },
  },
} as const;

type PersistReviewOptions = {
  actionRows?: {
    type: string;
    payload: Prisma.InputJsonValue;
  }[];
  actionStatus?: WorkflowStatus;
  metadata?: Record<string, unknown>;
};

async function getEventSnapshot(id: string) {
  return prisma.event.findUniqueOrThrow({
    where: { id },
    include: eventInclude,
  });
}

async function markForReview(
  eventId: string,
  reason: string,
  options: PersistReviewOptions = {},
) {
  await prisma.$transaction([
    ...(options.actionRows && options.actionRows.length > 0
      ? [
          prisma.action.createMany({
            data: options.actionRows.map((action) => ({
              event_id: eventId,
              type: action.type,
              payload: action.payload,
              status: options.actionStatus ?? "review_required",
            })),
          }),
        ]
      : []),
    prisma.event.update({
      where: { id: eventId },
      data: {
        status: "review_required",
      },
    }),
    prisma.reviewQueueItem.create({
      data: {
        event_id: eventId,
        reason,
        status: "review_required",
      },
    }),
    prisma.auditLog.create({
      data: {
        event_id: eventId,
        message: "Event sent to review queue",
        metadata: sanitizeJsonValue({
          reason,
          ...options.metadata,
        }),
      },
    }),
  ]);

  return getEventSnapshot(eventId);
}

export async function processIncomingEvent(input: unknown) {
  const topLevel = normalizeTopLevelEvent(input);
  const incoming = topLevel.normalized;

  if (topLevel.can_deduplicate) {
    const existing = await prisma.event.findUnique({
      where: {
        source_event_id: incoming.source_event_id,
      },
      include: eventInclude,
    });

    if (existing) {
      return {
        duplicate: true,
        event: existing,
      };
    }
  }

  let event;

  try {
    event = await prisma.event.create({
      data: {
        source_event_id: incoming.source_event_id,
        source: incoming.source,
        event_type: incoming.event_type,
        payload: sanitizeJsonValue(incoming.payload),
        status: "received",
        audit_logs: {
          create: {
            message: "Event received",
            metadata: sanitizeJsonValue({
              source: incoming.source,
              event_type: incoming.event_type,
            }),
          },
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.event.findUniqueOrThrow({
        where: {
          source_event_id: incoming.source_event_id,
        },
        include: eventInclude,
      });

      return {
        duplicate: true,
        event: existing,
      };
    }

    throw error;
  }

  if (topLevel.errors.length > 0) {
    const reviewEvent = await markForReview(
      event.id,
      topLevel.errors.join("; "),
      {
        metadata: {
          validation_errors: topLevel.errors,
        },
      },
    );

    return {
      duplicate: false,
      event: reviewEvent,
    };
  }

  const adapter = adapterRegistry.get(
    `${incoming.source}:${incoming.event_type}`,
  );

  if (!adapter) {
    const reviewEvent = await markForReview(
      event.id,
      `Unsupported event stream: ${incoming.source}:${incoming.event_type}`,
    );

    return {
      duplicate: false,
      event: reviewEvent,
    };
  }

  const payloadValidation = adapter.validate(incoming.payload);

  if (!payloadValidation.ok) {
    const reviewEvent = await markForReview(
      event.id,
      payloadValidation.errors.join("; "),
      {
        metadata: {
          validation_errors: payloadValidation.errors,
        },
      },
    );

    return {
      duplicate: false,
      event: reviewEvent,
    };
  }

  await prisma.$transaction([
    prisma.event.update({
      where: { id: event.id },
      data: {
        status: "processing",
      },
    }),
    prisma.auditLog.create({
      data: {
        event_id: event.id,
        message: "Workflow processing started",
        metadata: sanitizeJsonValue({
          adapter: `${adapter.source}:${adapter.eventType}`,
        }),
      },
    }),
  ]);

  const actions = adapter.buildActions(payloadValidation.data);

  try {
    const executionResult = await adapter.execute(payloadValidation.data, actions);

    if (!executionResult.success) {
      const reviewEvent = await markForReview(
        event.id,
        executionResult.review_reason ?? "External service execution failed",
        {
          actionRows: actions,
          actionStatus: "failed",
          metadata: {
            execution_failed: true,
          },
        },
      );

      if (executionResult.audit_logs.length > 0) {
        await prisma.auditLog.createMany({
          data: executionResult.audit_logs.map((log) => ({
            event_id: event.id,
            message: log.message,
            metadata: log.metadata ?? undefined,
          })),
        });
      }

      return {
        duplicate: false,
        event: await getEventSnapshot(reviewEvent.id),
      };
    }

    await prisma.$transaction([
      prisma.action.createMany({
        data: actions.map((action) => ({
          event_id: event.id,
          type: action.type,
          payload: action.payload,
          status: "completed",
        })),
      }),
      prisma.event.update({
        where: { id: event.id },
        data: {
          status: "completed",
        },
      }),
      prisma.auditLog.createMany({
        data: executionResult.audit_logs.map((log) => ({
          event_id: event.id,
          message: log.message,
          metadata: log.metadata ?? undefined,
        })),
      }),
    ]);

    return {
      duplicate: false,
      event: await getEventSnapshot(event.id),
    };
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : "Unexpected workflow execution error";

    const reviewEvent = await markForReview(event.id, reason, {
      actionRows: actions,
      actionStatus: "failed",
      metadata: {
        unexpected_error: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        event_id: event.id,
        message: "Workflow execution threw an unexpected error",
        metadata: sanitizeJsonValue({
          reason,
        }),
      },
    });

    return {
      duplicate: false,
      event: reviewEvent,
    };
  }
}
