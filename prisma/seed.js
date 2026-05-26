const { prisma } = require("../src/backend/db/prisma");
const { processIncomingEvent } = require("../src/backend/services/workflowEngine");

const sampleEvents = [
  {
    source_event_id: "finance-seed-001",
    source: "financeops",
    event_type: "invoice.overdue",
    payload: {
      invoice_id: "INV-1001",
      customer_name: "Luna Cafe",
      amount: 1280,
      currency: "USD",
      days_overdue: 18,
    },
  },
  {
    source_event_id: "campaign-seed-001",
    source: "campaignops",
    event_type: "client_brief.received",
    payload: {
      client: "Luna Cafe",
      campaign_goal: "Boost brunch bookings",
      channels: ["instagram", "email", "landing_page"],
      deadline: "2026-06-30",
    },
  },
  {
    source_event_id: "guest-seed-001",
    source: "guestops",
    event_type: "reservation.change_requested",
    payload: {
      reservation_id: "RES-1001",
      guest_name: "Maya Haddad",
      current_check_in: "2026-07-01",
      requested_check_in: "2026-07-05",
      nights: 3,
    },
  },
];

async function main() {
  for (const event of sampleEvents) {
    await processIncomingEvent(event);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
