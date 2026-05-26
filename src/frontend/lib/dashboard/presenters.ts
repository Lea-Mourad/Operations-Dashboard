import type {
  ActionRecord,
  AuditLogRecord,
  EventRecord,
  JsonValue,
} from "@/lib/dashboard/types";

export type DisplayField = {
  label: string;
  value: string;
};

export type PayloadDisplay = {
  fields: DisplayField[];
  tags?: string[];
  priority?: string;
};

export type ActionDisplay = {
  title: string;
  fields: DisplayField[];
  message?: string;
};

function asRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function getString(record: Record<string, JsonValue>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getNumber(record: Record<string, JsonValue>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : null;
}

function getBoolean(record: Record<string, JsonValue>, key: string) {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function getStringArray(record: Record<string, JsonValue>, key: string) {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function toLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount === null) {
    return "N/A";
  }

  if (!currency) {
    return String(amount);
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function scalarFields(record: Record<string, JsonValue>) {
  return Object.entries(record)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 5)
    .map(([key, value]) => ({
      label: toLabel(key),
      value: String(value),
    }));
}

export function getWorkflowLabel(event: Pick<EventRecord, "source" | "event_type">) {
  if (event.source === "financeops") return "FinanceOps";
  if (event.source === "campaignops") return "CampaignOps";
  if (event.source === "guestops") return "GuestOps";
  return `${event.source}:${event.event_type}`;
}

export function getEventOverview(event: EventRecord) {
  const payload = asRecord(event.payload);

  if (!payload) {
    return event.event_type;
  }

  if (event.source === "financeops") {
    const customer = getString(payload, "customer_name") ?? "Unknown customer";
    const invoiceId = getString(payload, "invoice_id") ?? "Unknown invoice";
    const days = getNumber(payload, "days_overdue");
    return `${customer} · ${invoiceId}${days !== null ? ` · ${days} days overdue` : ""}`;
  }

  if (event.source === "campaignops") {
    const client = getString(payload, "client") ?? "Unknown client";
    const channels = getStringArray(payload, "channels");
    const deadline = getString(payload, "deadline");
    return `${client} · ${channels.length} channel${channels.length === 1 ? "" : "s"}${deadline ? ` · due ${deadline}` : ""}`;
  }

  if (event.source === "guestops") {
    const guest = getString(payload, "guest_name") ?? "Unknown guest";
    const reservationId = getString(payload, "reservation_id") ?? "Unknown reservation";
    const requestedCheckIn = getString(payload, "requested_check_in");
    return `${guest} · ${reservationId}${requestedCheckIn ? ` · requested ${requestedCheckIn}` : ""}`;
  }

  return event.event_type;
}

export function getEventPayloadDisplay(event: EventRecord): PayloadDisplay {
  const payload = asRecord(event.payload);

  if (!payload) {
    return {
      fields: [
        {
          label: "Payload",
          value: "Unavailable",
        },
      ],
    };
  }

  if (event.source === "financeops") {
    const daysOverdue = getNumber(payload, "days_overdue");
    const priority =
      daysOverdue !== null && daysOverdue > 14 ? "High" : "Normal";

    return {
      fields: [
        { label: "Customer", value: getString(payload, "customer_name") ?? "N/A" },
        { label: "Invoice ID", value: getString(payload, "invoice_id") ?? "N/A" },
        {
          label: "Amount",
          value: formatCurrency(
            getNumber(payload, "amount"),
            getString(payload, "currency"),
          ),
        },
        { label: "Currency", value: getString(payload, "currency") ?? "N/A" },
        {
          label: "Days overdue",
          value: daysOverdue !== null ? String(daysOverdue) : "N/A",
        },
        { label: "Priority", value: priority },
      ],
      priority,
    };
  }

  if (event.source === "campaignops") {
    return {
      fields: [
        { label: "Client", value: getString(payload, "client") ?? "N/A" },
        {
          label: "Campaign goal",
          value: getString(payload, "campaign_goal") ?? "N/A",
        },
        { label: "Deadline", value: getString(payload, "deadline") ?? "N/A" },
      ],
      tags: getStringArray(payload, "channels").map(toLabel),
    };
  }

  if (event.source === "guestops") {
    return {
      fields: [
        { label: "Guest name", value: getString(payload, "guest_name") ?? "N/A" },
        {
          label: "Reservation ID",
          value: getString(payload, "reservation_id") ?? "N/A",
        },
        {
          label: "Current check-in",
          value: getString(payload, "current_check_in") ?? "N/A",
        },
        {
          label: "Requested check-in",
          value: getString(payload, "requested_check_in") ?? "N/A",
        },
        {
          label: "Nights",
          value:
            getNumber(payload, "nights") !== null
              ? String(getNumber(payload, "nights"))
              : "N/A",
        },
      ],
    };
  }

  return {
    fields: scalarFields(payload),
  };
}

export function getActionDisplay(action: ActionRecord): ActionDisplay {
  const payload = asRecord(action.payload);

  if (!payload) {
    return {
      title: toLabel(action.type),
      fields: [],
    };
  }

  if (action.type === "send_payment_reminder") {
    return {
      title: "Payment Reminder",
      fields: [
        { label: "Target", value: getString(payload, "customer_name") ?? "N/A" },
        { label: "Invoice", value: getString(payload, "invoice_id") ?? "N/A" },
        { label: "Priority", value: toLabel(getString(payload, "priority") ?? "normal") },
      ],
    };
  }

  if (action.type === "create_follow_up_task") {
    return {
      title: "Follow-up Task",
      fields: [
        { label: "Invoice", value: getString(payload, "invoice_id") ?? "N/A" },
        { label: "Priority", value: toLabel(getString(payload, "priority") ?? "normal") },
        { label: "Task", value: getString(payload, "title") ?? "N/A" },
      ],
    };
  }

  if (action.type === "create_campaign_task") {
    return {
      title: getString(payload, "channel") === "qa" ? "Final QA Task" : "Campaign Task",
      fields: [
        { label: "Channel", value: toLabel(getString(payload, "channel") ?? "unknown") },
        { label: "Deadline", value: getString(payload, "deadline") ?? "N/A" },
        { label: "Client", value: getString(payload, "client") ?? "N/A" },
      ],
      message: getString(payload, "title") ?? undefined,
    };
  }

  if (action.type === "request_reservation_change") {
    return {
      title: "Reservation Change Request",
      fields: [
        {
          label: "Reservation",
          value: getString(payload, "reservation_id") ?? "N/A",
        },
        {
          label: "Requested date",
          value: getString(payload, "requested_check_in") ?? "N/A",
        },
      ],
    };
  }

  if (action.type === "generate_guest_message") {
    return {
      title: "Guest Message",
      fields: [
        {
          label: "Reservation",
          value: getString(payload, "reservation_id") ?? "N/A",
        },
        { label: "Guest", value: getString(payload, "guest_name") ?? "N/A" },
      ],
      message: getString(payload, "message") ?? undefined,
    };
  }

  return {
    title: toLabel(action.type),
    fields: scalarFields(payload),
  };
}

export function summarizeActions(actions: ActionRecord[]) {
  if (actions.length === 0) {
    return "No actions generated";
  }

  const preview = actions
    .slice(0, 2)
    .map((action) => getActionDisplay(action).title)
    .join(", ");

  return actions.length > 2 ? `${preview} +${actions.length - 2} more` : preview;
}

export function summarizeAuditMetadata(
  item: Pick<AuditLogRecord, "message" | "metadata">,
) {
  const metadata = item.metadata ? asRecord(item.metadata) : null;

  if (!metadata) {
    return "No additional metadata";
  }

  if (Array.isArray(metadata.validation_errors)) {
    const issues = metadata.validation_errors.filter(
      (entry): entry is string => typeof entry === "string",
    );

    if (issues.length > 0) {
      return `Validation: ${issues.join("; ")}`;
    }
  }

  if (typeof metadata.reason === "string") {
    return `Reason: ${metadata.reason}`;
  }

  if (typeof metadata.invoice_id === "string") {
    return `Invoice ${metadata.invoice_id}`;
  }

  if (typeof metadata.reservation_id === "string") {
    return `Reservation ${metadata.reservation_id}`;
  }

  if (typeof metadata.client === "string" && typeof metadata.task_count === "number") {
    return `${metadata.client} · ${metadata.task_count} tasks generated`;
  }

  if (typeof metadata.client === "string") {
    return metadata.client;
  }

  if (typeof metadata.adapter === "string") {
    return `Adapter ${metadata.adapter}`;
  }

  if (typeof metadata.review_queue_item_id === "string") {
    return `Resolved queue item ${metadata.review_queue_item_id}`;
  }

  if (getBoolean(metadata, "execution_failed")) {
    return "External service execution failed";
  }

  if (getBoolean(metadata, "unexpected_error")) {
    return "Unexpected workflow error";
  }

  const fields = scalarFields(metadata);
  if (fields.length === 0) {
    return "Metadata available";
  }

  return fields.map((field) => `${field.label}: ${field.value}`).join(" · ");
}
