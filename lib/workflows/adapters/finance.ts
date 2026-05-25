import { mockFinanceService } from "@/lib/services/mockFinanceService";
import {
  requireNumber,
  requireString,
  sanitizeJsonValue,
  type ValidationResult,
} from "@/lib/validation";
import type { WorkflowAdapter, WorkflowActionDraft } from "@/lib/workflows/types";

export type FinancePayload = {
  invoice_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  days_overdue: number;
  simulate_failure?: boolean;
};

function validateFinancePayload(payload: unknown): ValidationResult<FinancePayload> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      errors: ["Payload is ambiguous or invalid for FinanceOps"],
    };
  }

  const record = payload as Record<string, unknown>;
  const errors: string[] = [];

  requireString(record, "invoice_id", errors);
  requireString(record, "customer_name", errors);
  requireNumber(record, "amount", errors);
  requireString(record, "currency", errors);
  requireNumber(record, "days_overdue", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: record as unknown as FinancePayload,
  };
}

function buildFinanceActions(payload: FinancePayload): WorkflowActionDraft[] {
  const priority = payload.days_overdue > 14 ? "high" : "normal";

  return [
    {
      type: "send_payment_reminder",
      payload: sanitizeJsonValue({
        invoice_id: payload.invoice_id,
        customer_name: payload.customer_name,
        amount: payload.amount,
        currency: payload.currency,
        priority,
      }),
    },
    {
      type: "create_follow_up_task",
      payload: sanitizeJsonValue({
        title: `Follow up on overdue invoice ${payload.invoice_id}`,
        invoice_id: payload.invoice_id,
        customer_name: payload.customer_name,
        priority,
      }),
    },
  ];
}

export const financeAdapter: WorkflowAdapter<FinancePayload> = {
  source: "financeops",
  eventType: "invoice.overdue",
  validate: validateFinancePayload,
  buildActions: buildFinanceActions,
  async execute(payload) {
    const result = await mockFinanceService(payload);

    if (!result.success) {
      return {
        success: false,
        review_reason: result.message,
        audit_logs: [
          {
            message: "FinanceOps mock service failed",
            metadata: sanitizeJsonValue(result.metadata ?? {}),
          },
        ],
      };
    }

    return {
      success: true,
      audit_logs: [
        {
          message: "FinanceOps workflow executed",
          metadata: sanitizeJsonValue(result.metadata ?? {}),
        },
      ],
    };
  },
};
