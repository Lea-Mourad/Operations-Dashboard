const { Prisma } = require("../db/prisma");
const actionRepository = require("../repositories/actionRepository");
const auditRepository = require("../repositories/auditRepository");
const eventRepository = require("../repositories/eventRepository");
const reviewRepository = require("../repositories/reviewRepository");
const {
  normalizeTopLevelEvent,
  sanitizeJsonValue,
} = require("./workflowUtils");
const { financeAdapter } = require("../workflows/adapters/finance.adapter");
const { campaignAdapter } = require("../workflows/adapters/campaign.adapter");
const { guestAdapter } = require("../workflows/adapters/guest.adapter");
const { prisma } = require("../db/prisma");

const workflowAdapters = [financeAdapter, campaignAdapter, guestAdapter];

const adapterRegistry = new Map(
  workflowAdapters.map((adapter) => [
    `${adapter.source}:${adapter.eventType}`,
    adapter,
  ]),
);

async function markForReview(eventId, reason, options = {}) {
  await prisma.$transaction([
    ...(options.actionRows && options.actionRows.length > 0
      ? [
          actionRepository.createMany(
            options.actionRows.map((action) => ({
              event_id: eventId,
              type: action.type,
              payload: action.payload,
              status: options.actionStatus || "review_required",
            })),
          ),
        ]
      : []),
    eventRepository.updateStatus(eventId, "review_required"),
    reviewRepository.create({
      event_id: eventId,
      reason,
      status: "review_required",
    }),
    auditRepository.create({
      event_id: eventId,
      message: "Event sent to review queue",
      metadata: sanitizeJsonValue({
        reason,
        ...(options.metadata || {}),
      }),
    }),
  ]);

  return eventRepository.getSnapshot(eventId);
}

async function processIncomingEvent(input) {
  const topLevel = normalizeTopLevelEvent(input);
  const incoming = topLevel.normalized;

  if (topLevel.can_deduplicate) {
    const existing = await eventRepository.findBySourceEventId(
      incoming.source_event_id,
    );

    if (existing) {
      return {
        duplicate: true,
        event: existing,
      };
    }
  }

  let event;

  try {
    event = await eventRepository.create({
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
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await eventRepository.findBySourceEventId(
        incoming.source_event_id,
      );

      return {
        duplicate: true,
        event: existing,
      };
    }

    throw error;
  }

  if (topLevel.errors.length > 0) {
    const reviewEvent = await markForReview(event.id, topLevel.errors.join("; "), {
      metadata: {
        validation_errors: topLevel.errors,
      },
    });

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
    eventRepository.updateStatus(event.id, "processing"),
    auditRepository.create({
      event_id: event.id,
      message: "Workflow processing started",
      metadata: sanitizeJsonValue({
        adapter: `${adapter.source}:${adapter.eventType}`,
      }),
    }),
  ]);

  const actions = adapter.buildActions(payloadValidation.data);

  try {
    const executionResult = await adapter.execute(payloadValidation.data, actions);

    if (!executionResult.success) {
      const reviewEvent = await markForReview(
        event.id,
        executionResult.review_reason || "External service execution failed",
        {
          actionRows: actions,
          actionStatus: "failed",
          metadata: {
            execution_failed: true,
          },
        },
      );

      if (executionResult.audit_logs.length > 0) {
        await auditRepository.createMany(
          executionResult.audit_logs.map((log) => ({
            event_id: event.id,
            message: log.message,
            metadata: log.metadata || undefined,
          })),
        );
      }

      return {
        duplicate: false,
        event: await eventRepository.getSnapshot(reviewEvent.id),
      };
    }

    await prisma.$transaction([
      actionRepository.createMany(
        actions.map((action) => ({
          event_id: event.id,
          type: action.type,
          payload: action.payload,
          status: "completed",
        })),
      ),
      eventRepository.updateStatus(event.id, "completed"),
      auditRepository.createMany(
        executionResult.audit_logs.map((log) => ({
          event_id: event.id,
          message: log.message,
          metadata: log.metadata || undefined,
        })),
      ),
    ]);

    return {
      duplicate: false,
      event: await eventRepository.getSnapshot(event.id),
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

    await auditRepository.create({
      event_id: event.id,
      message: "Workflow execution threw an unexpected error",
      metadata: sanitizeJsonValue({
        reason,
      }),
    });

    return {
      duplicate: false,
      event: reviewEvent,
    };
  }
}

module.exports = {
  processIncomingEvent,
};
