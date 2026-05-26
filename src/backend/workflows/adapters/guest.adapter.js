const { mockGuestService } = require("../../services/mockGuestService");
const {
  requireString,
  sanitizeJsonValue,
} = require("../../services/workflowUtils");

function validate(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      errors: ["Payload is ambiguous or invalid for GuestOps"],
    };
  }

  const errors = [];

  requireString(payload, "reservation_id", errors);
  requireString(payload, "guest_name", errors);
  requireString(payload, "requested_check_in", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: payload,
  };
}

function buildActions(payload) {
  return [
    {
      type: "request_reservation_change",
      payload: sanitizeJsonValue({
        reservation_id: payload.reservation_id,
        requested_check_in: payload.requested_check_in,
      }),
    },
    {
      type: "generate_guest_message",
      payload: sanitizeJsonValue({
        reservation_id: payload.reservation_id,
        guest_name: payload.guest_name,
        message: `Hi ${payload.guest_name}, we received your request to change reservation ${payload.reservation_id}.`,
      }),
    },
  ];
}

async function execute(payload) {
  const result = await mockGuestService(payload);

  if (!result.success) {
    return {
      success: false,
      review_reason: result.message,
      audit_logs: [
        {
          message: "GuestOps mock service failed",
          metadata: sanitizeJsonValue(result.metadata || {}),
        },
      ],
    };
  }

  return {
    success: true,
    audit_logs: [
      {
        message: "GuestOps workflow executed",
        metadata: sanitizeJsonValue(result.metadata || {}),
      },
    ],
  };
}

module.exports = {
  guestAdapter: {
    source: "guestops",
    eventType: "reservation.change_requested",
    validate,
    buildActions,
    execute,
  },
};
