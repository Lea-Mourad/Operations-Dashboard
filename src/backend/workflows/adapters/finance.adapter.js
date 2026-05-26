const { mockFinanceService } = require("../../services/mockFinanceService");
const {
  requireNumber,
  requireString,
  sanitizeJsonValue,
} = require("../../services/workflowUtils");

function validate(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      errors: ["Payload is ambiguous or invalid for FinanceOps"],
    };
  }

  const errors = [];

  requireString(payload, "invoice_id", errors);
  requireString(payload, "customer_name", errors);
  requireNumber(payload, "amount", errors);
  requireString(payload, "currency", errors);
  requireNumber(payload, "days_overdue", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: payload,
  };
}

function buildActions(payload) {
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

async function execute(payload) {
  const result = await mockFinanceService(payload);

  if (!result.success) {
    return {
      success: false,
      review_reason: result.message,
      audit_logs: [
        {
          message: "FinanceOps mock service failed",
          metadata: sanitizeJsonValue(result.metadata || {}),
        },
      ],
    };
  }

  return {
    success: true,
    audit_logs: [
      {
        message: "FinanceOps workflow executed",
        metadata: sanitizeJsonValue(result.metadata || {}),
      },
    ],
  };
}

module.exports = {
  financeAdapter: {
    source: "financeops",
    eventType: "invoice.overdue",
    validate,
    buildActions,
    execute,
  },
};
