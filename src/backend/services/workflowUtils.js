const { randomUUID } = require("node:crypto");

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJsonValue(value) {
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
    return value.map((item) => (item === undefined ? null : toJsonValue(item)));
  }

  if (isRecord(value)) {
    const output = {};

    for (const [key, entry] of Object.entries(value)) {
      output[key] = entry === undefined ? null : toJsonValue(entry);
    }

    return output;
  }

  return String(value);
}

function sanitizeJsonValue(value) {
  return toJsonValue(value) ?? {};
}

function normalizeTopLevelEvent(input) {
  const errors = [];
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
      source_event_id: sourceEventId || `invalid-${randomUUID()}`,
      source: source || "unknown",
      event_type: eventType || "unknown",
      payload,
      original_source_event_id: sourceEventId || undefined,
    },
    errors,
    can_deduplicate: Boolean(sourceEventId),
  };
}

function requireString(payload, field, errors) {
  const value = payload[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`Missing or invalid payload field: ${field}`);
  }
}

function requireNumber(payload, field, errors) {
  const value = payload[field];

  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push(`Missing or invalid payload field: ${field}`);
  }
}

module.exports = {
  sanitizeJsonValue,
  normalizeTopLevelEvent,
  requireString,
  requireNumber,
  isRecord,
};
