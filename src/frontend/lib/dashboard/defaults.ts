function buildSourceEventId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createFinanceDefaults() {
  return {
    source_event_id: buildSourceEventId("fin"),
    invoice_id: "INV-2026-402",
    customer_name: "Luna Cafe",
    amount: "1850",
    currency: "USD",
    days_overdue: "18",
    simulate_failure: false,
  };
}

export function createCampaignDefaults() {
  return {
    source_event_id: buildSourceEventId("camp"),
    client: "North Harbor Hotels",
    campaign_goal: "Drive summer reservation demand",
    channels: ["instagram", "email", "landing_page"],
    deadline: "2026-06-30",
    simulate_failure: false,
  };
}

export function createGuestDefaults() {
  return {
    source_event_id: buildSourceEventId("guest"),
    reservation_id: "RES-41002",
    guest_name: "Maya Haddad",
    current_check_in: "2026-06-18",
    requested_check_in: "2026-06-20",
    nights: "3",
    simulate_failure: false,
  };
}

export function createAdvancedJsonDefault() {
  return JSON.stringify(
    {
      source_event_id: buildSourceEventId("fin"),
      source: "financeops",
      event_type: "invoice.overdue",
      payload: {
        invoice_id: "INV-2026-402",
        customer_name: "Luna Cafe",
        amount: 1850,
        currency: "USD",
        days_overdue: 18,
      },
    },
    null,
    2,
  );
}
