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
  ])
);

function getAdapter(source, eventType) {
  return adapterRegistry.get(`${source}:${eventType}`);
}

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
            }))
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

async function keepInReview(eventId, reviewItemId, reason, options = {}) {
  const operations = [
    eventRepository.updateStatus(eventId, "review_required"),
    auditRepository.create({
      event_id: eventId,
      message: options.auditMessage || "Reprocessing still requires review",
      metadata: sanitizeJsonValue({
        reason,
        review_queue_item_id: reviewItemId,
        ...(options.metadata || {}),
      }),
    }),
  ];

  if (reviewItemId) {
    operations.unshift(
      reviewRepository.update(reviewItemId, {
        reason,
        status: "review_required",
        resolved_at: null,
      })
    );
  } else {
    operations.unshift(
      reviewRepository.create({
        event_id: eventId,
        reason,
        status: "review_required",
      })
    );
  }

  if (options.actionRows && options.actionRows.length > 0) {
    operations.unshift(
      actionRepository.createMany(
        options.actionRows.map((action) => ({
          event_id: eventId,
          type: action.type,
          payload: action.payload,
          status: options.actionStatus || "review_required",
        }))
      )
    );
  }

  await prisma.$transaction(operations);

  return eventRepository.getSnapshot(eventId);
}

async function markAsFailed(eventId, reason, actions = [], metadata = {}) {
  await prisma.$transaction([
    ...(actions.length > 0
      ? [
          actionRepository.createMany(
            actions.map((action) => ({
              event_id: eventId,
              type: action.type,
              payload: action.payload,
              status: "failed",
            }))
          ),
        ]
      : []),

    eventRepository.updateStatus(eventId, "failed"),

    reviewRepository.create({
      event_id: eventId,
      reason,
      status: "review_required",
    }),

    auditRepository.create({
      event_id: eventId,
      message: "Mock service execution failed",
      metadata: sanitizeJsonValue({
        reason,
        ...metadata,
      }),
    }),
  ]);

  return eventRepository.getSnapshot(eventId);
}

async function failExistingEvent(eventId, reviewItemId, reason, actions = [], metadata = {}) {
  const operations = [
    ...(actions.length > 0
      ? [
          actionRepository.createMany(
            actions.map((action) => ({
              event_id: eventId,
              type: action.type,
              payload: action.payload,
              status: "failed",
            }))
          ),
        ]
      : []),
    eventRepository.updateStatus(eventId, "failed"),
    auditRepository.create({
      event_id: eventId,
      message: "Mock service execution failed",
      metadata: sanitizeJsonValue({
        reason,
        ...metadata,
      }),
    }),
  ];

  if (reviewItemId) {
    operations.push(
      reviewRepository.update(reviewItemId, {
        reason,
        status: "review_required",
        resolved_at: null,
      })
    );
  } else {
    operations.push(
      reviewRepository.create({
        event_id: eventId,
        reason,
        status: "review_required",
      })
    );
  }

  await prisma.$transaction(operations);

  return eventRepository.getSnapshot(eventId);
}

async function executeWorkflowForEvent({
  eventId,
  source,
  eventType,
  payload,
  reviewItemId,
  resolutionNotes,
  isReprocess = false,
}) {
  const adapter = getAdapter(source, eventType);

  if (!adapter) {
    const reason = `Unsupported event stream: ${source}:${eventType}`;
    const event = isReprocess
      ? await keepInReview(eventId, reviewItemId, reason)
      : await markForReview(eventId, reason);

    return {
      duplicate: false,
      event,
    };
  }

  const payloadValidation = adapter.validate(payload);

  if (!payloadValidation.ok) {
    const reason = payloadValidation.errors.join("; ");
    const event = isReprocess
      ? await keepInReview(eventId, reviewItemId, reason, {
          metadata: {
            validation_errors: payloadValidation.errors,
          },
        })
      : await markForReview(eventId, reason, {
          metadata: {
            validation_errors: payloadValidation.errors,
          },
        });

    return {
      duplicate: false,
      event,
    };
  }

  await prisma.$transaction([
    eventRepository.updateStatus(eventId, "processing"),
    auditRepository.create({
      event_id: eventId,
      message: "Workflow processing started",
      metadata: sanitizeJsonValue({
        adapter: `${adapter.source}:${adapter.eventType}`,
        reprocess: isReprocess,
      }),
    }),
  ]);

  const actions = adapter.buildActions(payloadValidation.data);

  try {
    const executionResult = await adapter.execute(payloadValidation.data, actions);

    if (!executionResult.success) {
      const failedEvent = isReprocess
        ? await failExistingEvent(
            eventId,
            reviewItemId,
            executionResult.review_reason || "External service execution failed",
            actions,
            {
              execution_failed: true,
              reprocess: true,
            }
          )
        : await markAsFailed(
            eventId,
            executionResult.review_reason || "External service execution failed",
            actions,
            {
              execution_failed: true,
            }
          );

      if (executionResult.audit_logs && executionResult.audit_logs.length > 0) {
        await auditRepository.createMany(
          executionResult.audit_logs.map((log) => ({
            event_id: eventId,
            message: log.message,
            metadata: sanitizeJsonValue(log.metadata || {}),
          }))
        );
      }

      if (isReprocess) {
        await auditRepository.create({
          event_id: eventId,
          message: "Reprocessing failed and requires follow-up review",
          metadata: sanitizeJsonValue({
            review_queue_item_id: reviewItemId,
            reason:
              executionResult.review_reason || "External service execution failed",
          }),
        });
      }

      return {
        duplicate: false,
        event: await eventRepository.getSnapshot(failedEvent.id),
      };
    }

    const operations = [
      actionRepository.createMany(
        actions.map((action) => ({
          event_id: eventId,
          type: action.type,
          payload: action.payload,
          status: "completed",
        }))
      ),
      eventRepository.updateStatus(eventId, "completed"),
      auditRepository.createMany(
        executionResult.audit_logs.map((log) => ({
          event_id: eventId,
          message: log.message,
          metadata: sanitizeJsonValue(log.metadata || {}),
        }))
      ),
    ];

    if (isReprocess && reviewItemId) {
      operations.push(
        reviewRepository.update(reviewItemId, {
          status: "resolved",
          resolved_at: new Date(),
          resolution_notes:
            typeof resolutionNotes === "string" && resolutionNotes.trim().length > 0
              ? resolutionNotes.trim()
              : "Reprocessed successfully",
        })
      );
      operations.push(
        auditRepository.create({
          event_id: eventId,
          message: "Review item resolved after successful reprocessing",
          metadata: sanitizeJsonValue({
            review_queue_item_id: reviewItemId,
            resolution_notes:
              typeof resolutionNotes === "string" && resolutionNotes.trim().length > 0
                ? resolutionNotes.trim()
                : "Reprocessed successfully",
          }),
        })
      );
    }

    await prisma.$transaction(operations);

    return {
      duplicate: false,
      event: await eventRepository.getSnapshot(eventId),
    };
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : "Unexpected workflow execution error";

    const failedEvent = isReprocess
      ? await failExistingEvent(eventId, reviewItemId, reason, actions, {
          unexpected_error: true,
          reprocess: true,
        })
      : await markAsFailed(eventId, reason, actions, {
          unexpected_error: true,
        });

    await auditRepository.create({
      event_id: eventId,
      message: "Workflow execution threw an unexpected error",
      metadata: sanitizeJsonValue({
        reason,
      }),
    });

    return {
      duplicate: false,
      event: failedEvent,
    };
  }
}

async function processIncomingEvent(input) {
  const topLevel = normalizeTopLevelEvent(input);
  const incoming = topLevel.normalized;

  if (topLevel.can_deduplicate) {
    const existing = await eventRepository.findBySourceEventId(
      incoming.source_event_id
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
        incoming.source_event_id
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

  return executeWorkflowForEvent({
    eventId: event.id,
    source: incoming.source,
    eventType: incoming.event_type,
    payload: incoming.payload,
  });
}

async function reprocessReviewItem(reviewItemId, payload, resolutionNotes) {
  const reviewItem = await reviewRepository.findById(reviewItemId);

  if (!reviewItem) {
    throw new Error("Review queue item not found");
  }

  const sanitizedPayload = sanitizeJsonValue(payload);

  await prisma.$transaction([
    actionRepository.deleteByEventId(reviewItem.event_id),
    eventRepository.update(reviewItem.event_id, {
      payload: sanitizedPayload,
      status: "processing",
    }),
    auditRepository.create({
      event_id: reviewItem.event_id,
      message: "Operator edited payload for reprocessing",
      metadata: sanitizeJsonValue({
        review_queue_item_id: reviewItemId,
        resolution_notes:
          typeof resolutionNotes === "string" ? resolutionNotes.trim() : "",
      }),
    }),
  ]);

  return executeWorkflowForEvent({
    eventId: reviewItem.event_id,
    source: reviewItem.event.source,
    eventType: reviewItem.event.event_type,
    payload: sanitizedPayload,
    reviewItemId,
    resolutionNotes,
    isReprocess: true,
  });
}

module.exports = {
  processIncomingEvent,
  reprocessReviewItem,
};
