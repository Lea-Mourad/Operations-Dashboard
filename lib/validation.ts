import { Prisma } from "@prisma/client";

export const workflowStatuses = [
  "received",
  "processing",
  "completed",
  "review_required",
  "failed",
] as const;

export type WorkflowStatus = (typeof workflowStatuses)[number];

export type ValidationResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      errors: string[];
    };

export type NormalizedIncomingEvent = {
  source_event_id: string;
  source: string;
  event_type: string;
  payload: Record<string, unknown>;
  original_source_event_id?: string;
};

export type TopLevelValidationResult = {
  normalized: NormalizedIncomingEvent;
  errors: string[];
  can_deduplicate: boolean;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      item === undefined ? null : toPrismaJson(item),
    ) as Prisma.InputJsonArray;
  }

  if (isRecord(value)) {
    const output: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, entry] of Object.entries(value)) {
      output[key] = entry === undefined ? null : toPrismaJson(entry);
    }

    return output as Prisma.InputJsonObject;
  }

  return String(value);
}

export function sanitizeJsonValue(value: unknown): Prisma.InputJsonValue {
  return toPrismaJson(value) ?? {};
}

export function normalizeTopLevelEvent(input: unknown): TopLevelValidationResult {
  const errors: string[] = [];
  const record = isRecord(input) ? input : {};

  const sourceEventId =
    typeof record.source_event_id === "string"
      ? record.source_event_id.trim()
      : "";
  const source =
    typeof record.source === "string" ? record.source.trim().toLowerCase() : "";
  const eventType =
    typeof record.event_type === "string"
      ? record.event_type.trim().toLowerCase()
      : "";
  const payload = isRecord(record.payload) ? record.payload : {};

  if (!sourceEventId) {
    errors.push("Missing required field: source_event_id");
  }

  if (!source) {
    errors.push("Missing required field: source");
  }

  if (!eventType) {
    errors.push("Missing required field: event_type");
  }

  if (!isRecord(record.payload)) {
    errors.push("Missing or invalid required field: payload");
  }

  return {
    normalized: {
      source_event_id: sourceEventId || `invalid-${crypto.randomUUID()}`,
      source: source || "unknown",
      event_type: eventType || "unknown",
      payload,
      original_source_event_id: sourceEventId || undefined,
    },
    errors,
    can_deduplicate: Boolean(sourceEventId),
  };
}

export function requireString(
  payload: Record<string, unknown>,
  field: string,
  errors: string[],
) {
  const value = payload[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`Missing or invalid payload field: ${field}`);
  }
}

export function requireNumber(
  payload: Record<string, unknown>,
  field: string,
  errors: string[],
) {
  const value = payload[field];

  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push(`Missing or invalid payload field: ${field}`);
  }
}
