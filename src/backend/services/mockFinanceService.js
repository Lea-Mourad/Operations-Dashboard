async function mockFinanceService(payload) {
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

module.exports = {
  mockFinanceService,
};
