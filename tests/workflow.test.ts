import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { processIncomingEvent } from "@/lib/workflows/engine";

async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.reviewQueueItem.deleteMany();
  await prisma.action.deleteMany();
  await prisma.event.deleteMany();
}

describe("workflow engine", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it("FinanceOps event succeeds", async () => {
    const result = await processIncomingEvent({
      source_event_id: "fin-test-001",
      source: "financeops",
      event_type: "invoice.overdue",
      payload: {
        invoice_id: "INV-1001",
        customer_name: "Luna Cafe",
        amount: 750,
        currency: "USD",
        days_overdue: 18,
      },
    });

    expect(result.duplicate).toBe(false);
    expect(result.event.status).toBe("completed");
    expect(result.event.actions).toHaveLength(2);
    expect(result.event.actions.map((action) => action.type)).toEqual([
      "send_payment_reminder",
      "create_follow_up_task",
    ]);
    expect(result.event.review_queue_items).toHaveLength(0);
  });

  it("CampaignOps event succeeds", async () => {
    const result = await processIncomingEvent({
      source_event_id: "camp-test-001",
      source: "campaignops",
      event_type: "client_brief.received",
      payload: {
        client: "Luna Cafe",
        campaign_goal: "Boost brunch bookings",
        channels: ["Instagram", "Email"],
        deadline: "2026-06-30",
      },
    });

    expect(result.event.status).toBe("completed");
    expect(result.event.actions).toHaveLength(3);
    expect(result.event.actions[0]?.type).toBe("create_campaign_task");
    expect(result.event.review_queue_items).toHaveLength(0);
  });

  it("GuestOps event succeeds", async () => {
    const result = await processIncomingEvent({
      source_event_id: "guest-test-001",
      source: "guestops",
      event_type: "reservation.change_requested",
      payload: {
        reservation_id: "RES-1001",
        guest_name: "Maya Haddad",
        requested_check_in: "2026-07-05",
      },
    });

    expect(result.event.status).toBe("completed");
    expect(result.event.actions).toHaveLength(2);
    expect(result.event.actions.map((action) => action.type)).toEqual([
      "request_reservation_change",
      "generate_guest_message",
    ]);
  });

  it("Duplicate source_event_id does not create duplicate actions", async () => {
    const firstResult = await processIncomingEvent({
      source_event_id: "dup-test-001",
      source: "financeops",
      event_type: "invoice.overdue",
      payload: {
        invoice_id: "INV-2001",
        customer_name: "Luna Cafe",
        amount: 900,
        currency: "USD",
        days_overdue: 8,
      },
    });

    const secondResult = await processIncomingEvent({
      source_event_id: "dup-test-001",
      source: "financeops",
      event_type: "invoice.overdue",
      payload: {
        invoice_id: "INV-2001",
        customer_name: "Luna Cafe",
        amount: 900,
        currency: "USD",
        days_overdue: 8,
      },
    });

    const actionCount = await prisma.action.count();

    expect(firstResult.event.id).toBe(secondResult.event.id);
    expect(secondResult.duplicate).toBe(true);
    expect(actionCount).toBe(2);
  });

  it("Missing required field goes to review_required", async () => {
    const result = await processIncomingEvent({
      source_event_id: "invalid-test-001",
      source: "financeops",
      event_type: "invoice.overdue",
      payload: {
        invoice_id: "INV-3001",
        customer_name: "Luna Cafe",
        amount: 500,
        currency: "USD",
      },
    });

    expect(result.event.status).toBe("review_required");
    expect(result.event.review_queue_items).toHaveLength(1);
    expect(result.event.review_queue_items[0]?.reason).toContain(
      "days_overdue",
    );
  });

  it("Simulated external failure goes to review_required and is auditable", async () => {
    const result = await processIncomingEvent({
      source_event_id: "failure-test-001",
      source: "guestops",
      event_type: "reservation.change_requested",
      payload: {
        reservation_id: "RES-4001",
        guest_name: "Nour Saab",
        requested_check_in: "2026-08-10",
        simulate_failure: true,
      },
    });

    expect(result.event.status).toBe("review_required");
    expect(result.event.review_queue_items).toHaveLength(1);
    expect(result.event.actions.every((action) => action.status === "failed")).toBe(
      true,
    );
    expect(
      result.event.audit_logs.some((log) =>
        log.message.toLowerCase().includes("failed"),
      ),
    ).toBe(true);
  });
});
