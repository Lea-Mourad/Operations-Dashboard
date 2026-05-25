import { mockGuestService } from "@/lib/services/mockGuestService";
import {
  requireString,
  sanitizeJsonValue,
  type ValidationResult,
} from "@/lib/validation";
import type { WorkflowAdapter, WorkflowActionDraft } from "@/lib/workflows/types";

export type GuestPayload = {
  reservation_id: string;
  guest_name: string;
  requested_check_in: string;
  simulate_failure?: boolean;
};

function validateGuestPayload(payload: unknown): ValidationResult<GuestPayload> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      errors: ["Payload is ambiguous or invalid for GuestOps"],
    };
  }

  const record = payload as Record<string, unknown>;
  const errors: string[] = [];

  requireString(record, "reservation_id", errors);
  requireString(record, "guest_name", errors);
  requireString(record, "requested_check_in", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: record as unknown as GuestPayload,
  };
}

function buildGuestActions(payload: GuestPayload): WorkflowActionDraft[] {
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

export const guestAdapter: WorkflowAdapter<GuestPayload> = {
  source: "guestops",
  eventType: "reservation.change_requested",
  validate: validateGuestPayload,
  buildActions: buildGuestActions,
  async execute(payload) {
    const result = await mockGuestService(payload);

    if (!result.success) {
      return {
        success: false,
        review_reason: result.message,
        audit_logs: [
          {
            message: "GuestOps mock service failed",
            metadata: sanitizeJsonValue(result.metadata ?? {}),
          },
        ],
      };
    }

    return {
      success: true,
      audit_logs: [
        {
          message: "GuestOps workflow executed",
          metadata: sanitizeJsonValue(result.metadata ?? {}),
        },
      ],
    };
  },
};
