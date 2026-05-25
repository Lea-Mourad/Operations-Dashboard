export const sampleEvents = {
  finance: {
    source_event_id: "fin-seed-001",
    source: "financeops",
    event_type: "invoice.overdue",
    payload: {
      invoice_id: "INV-2026-001",
      customer_name: "Luna Cafe",
      amount: 1800,
      currency: "USD",
      days_overdue: 21,
    },
  },
  campaign: {
    source_event_id: "camp-seed-001",
    source: "campaignops",
    event_type: "client_brief.received",
    payload: {
      client: "Luna Cafe",
      campaign_goal: "Launch seasonal brunch menu",
      channels: ["Instagram", "Email", "Landing Page"],
      deadline: "2026-06-15",
      include_final_qa: true,
    },
  },
  guest: {
    source_event_id: "guest-seed-001",
    source: "guestops",
    event_type: "reservation.change_requested",
    payload: {
      reservation_id: "RES-9981",
      guest_name: "Maya Haddad",
      requested_check_in: "2026-06-20",
    },
  },
} as const;
