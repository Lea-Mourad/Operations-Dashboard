export type MockServiceResult = {
  success: boolean;
  message: string;
  metadata?: Record<string, unknown>;
};

type FinancePayload = {
  invoice_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  days_overdue: number;
  simulate_failure?: boolean;
};

export async function mockFinanceService(
  payload: FinancePayload,
): Promise<MockServiceResult> {
  if (payload.simulate_failure === true) {
    return {
      success: false,
      message: "FinanceOps mock service failed intentionally",
      metadata: {
        invoice_id: payload.invoice_id,
      },
    };
  }

  return {
    success: true,
    message: "FinanceOps reminder workflow executed",
    metadata: {
      invoice_id: payload.invoice_id,
      reminder_reference: `reminder-${payload.invoice_id}`,
    },
  };
}
