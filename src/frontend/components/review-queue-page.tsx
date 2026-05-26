"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import StatusBadge from "@/components/StatusBadge";
import {
  emitOperationsRefresh,
  fetchReviews,
  operationsRefreshEvent,
  reprocessReview,
  resolveReview,
} from "@/lib/dashboard/client";
import { getWorkflowLabel } from "@/lib/dashboard/presenters";
import type {
  JsonValue,
  ReprocessReviewResponse,
  ReviewListItem,
  ReviewsResponse,
} from "@/lib/dashboard/types";

type FinanceEditForm = {
  invoice_id: string;
  customer_name: string;
  amount: string;
  currency: string;
  days_overdue: string;
};

type CampaignEditForm = {
  client: string;
  campaign_goal: string;
  channels: string[];
  deadline: string;
};

type GuestEditForm = {
  reservation_id: string;
  guest_name: string;
  current_check_in: string;
  requested_check_in: string;
  nights: string;
};

type EditForm = FinanceEditForm | CampaignEditForm | GuestEditForm;

type ReprocessResultState = {
  eventId: string;
  eventStatus: string;
  message: string;
} | null;

const campaignChannels = [
  "instagram",
  "email",
  "landing_page",
  "tiktok",
  "google_ads",
] as const;

export default function ReviewQueuePage() {
  const [reviewItems, setReviewItems] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<Record<string, EditForm>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [reprocessResult, setReprocessResult] = useState<ReprocessResultState>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = (await fetchReviews()) as ReviewsResponse;

        if (!active) return;

        setReviewItems(data.reviewItems);
        setLoading(false);
        setError(null);
      } catch (error) {
        if (!active) return;

        setLoading(false);
        setError(error instanceof Error ? error.message : "Unable to load review queue");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [refreshCount]);

  useEffect(() => {
    function handleRefresh() {
      setLoading(true);
      setRefreshCount((count) => count + 1);
    }

    window.addEventListener(operationsRefreshEvent, handleRefresh);
    return () => window.removeEventListener(operationsRefreshEvent, handleRefresh);
  }, []);

  const activeReviewItems = useMemo(
    () => reviewItems.filter((item) => item.status === "review_required"),
    [reviewItems],
  );

  async function handleResolve(item: ReviewListItem) {
    setResolvingId(item.id);
    setError(null);

    try {
      await resolveReview(item.id, notes[item.id] || "Resolved manually");
      emitOperationsRefresh();
      setRefreshCount((count) => count + 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to resolve review item");
    } finally {
      setResolvingId(null);
    }
  }

  function startEditing(item: ReviewListItem) {
    setEditingId(item.id);
    setEditForms((current) => ({
      ...current,
      [item.id]: current[item.id] ?? createEditForm(item),
    }));
  }

  async function handleReprocess(item: ReviewListItem) {
    const form = editForms[item.id] ?? createEditForm(item);
    const payload = buildPayload(item, form);

    setReprocessingId(item.id);
    setError(null);
    setReprocessResult(null);

    try {
      const result = (await reprocessReview(
        item.id,
        payload,
        notes[item.id] || "Operator corrected payload",
      )) as ReprocessReviewResponse;

      emitOperationsRefresh();
      setRefreshCount((count) => count + 1);
      setEditingId(null);
      setReprocessResult({
        eventId: result.event.id,
        eventStatus: result.event.status,
        message:
          result.event.status === "completed"
            ? "Event reprocessed successfully."
            : result.event.status === "failed"
              ? "Reprocessing failed and the result was saved to the event history."
              : "Reprocessing still requires review.",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to reprocess review item");
    } finally {
      setReprocessingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-[var(--border)] bg-white p-8 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.9)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Review Queue
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
          Review and fix blocked events
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
          When an event cannot be completed safely, it shows up here. In most cases, you can correct the fields and run the same event again.
        </p>
      </section>

      {reprocessResult ? (
        <section
          className={`rounded-[10px] border px-4 py-3 text-sm ${
            reprocessResult.eventStatus === "completed"
              ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
              : reprocessResult.eventStatus === "failed"
                ? "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
                : "border-[#fde68a] bg-[#fffbeb] text-[#b45309]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{reprocessResult.message}</span>
            <Link href={`/events/${reprocessResult.eventId}`} className="font-medium underline">
              Open event detail
            </Link>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      {activeReviewItems.length === 0 && !loading ? (
        <div className="rounded-[10px] border border-[var(--border)] bg-white px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
          No review items are currently open.
        </div>
      ) : null}

      <div className="space-y-4">
        {activeReviewItems.map((item) => {
          const isEditing = editingId === item.id;
          const form = editForms[item.id] ?? createEditForm(item);

          return (
            <section
              key={item.id}
            className="rounded-[20px] border border-[var(--border)] bg-white p-6 shadow-[0_10px_26px_-26px_rgba(15,23,42,0.9)]"
          >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {getWorkflowLabel({
                      source: item.event.source,
                      event_type: item.event.event_type,
                    })}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">
                    {item.event.event_type}
                  </h2>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <div className="mt-4 rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#b45309]">
                {item.reason}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryStat label="Event ID" value={item.event.source_event_id} code />
                <SummaryStat label="Workflow type" value={item.event.event_type} />
                <SummaryStat label="Created" value={formatDate(item.created_at)} />
                <SummaryStat label="Event status" value={item.event.status} />
              </div>

              <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  What to do here
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Fix the fields below, then use the blue button to re-run this same event. The system will keep the history and avoid creating a duplicate.
                </p>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                  <ReviewPayloadEditor
                    item={item}
                    form={form}
                    onChange={(next) =>
                      setEditForms((current) => ({
                        ...current,
                        [item.id]: next,
                      }))
                    }
                  />
                </div>
              ) : null}

              <div className="mt-4">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Resolution notes
                  </span>
                  <textarea
                    value={notes[item.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    placeholder="Fixed missing guest name"
                    className="min-h-[96px] w-full px-3 py-2.5 text-sm"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => startEditing(item)}
                    className="rounded-[7px] bg-[#2563eb] px-4 py-2 text-sm font-medium text-white"
                  >
                    Edit & Reprocess
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReprocess(item)}
                      disabled={reprocessingId === item.id}
                      className="rounded-[7px] bg-[#2563eb] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {reprocessingId === item.id ? "Reprocessing..." : "Save edits & reprocess"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-[7px] border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[var(--text)]"
                    >
                      Cancel
                    </button>
                  </>
                )}

                <Link
                  href={`/events/${item.event.id}`}
                  className="inline-flex items-center justify-center rounded-[7px] border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[var(--text)]"
                >
                  Open event
                </Link>

                  <button
                    type="button"
                    onClick={() => handleResolve(item)}
                    disabled={resolvingId === item.id}
                    className="rounded-[7px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-sm font-medium text-[#15803d] disabled:opacity-60"
                  >
                    {resolvingId === item.id ? "Resolving..." : "Resolve manually"}
                  </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ReviewPayloadEditor({
  item,
  form,
  onChange,
}: {
  item: ReviewListItem;
  form: EditForm;
  onChange: (next: EditForm) => void;
}) {
  if (item.event.source === "financeops") {
    const value = form as FinanceEditForm;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="invoice_id"
          value={value.invoice_id}
          onChange={(next) => onChange({ ...value, invoice_id: next })}
        />
        <TextField
          label="customer_name"
          value={value.customer_name}
          onChange={(next) => onChange({ ...value, customer_name: next })}
        />
        <TextField
          label="amount"
          type="number"
          value={value.amount}
          onChange={(next) => onChange({ ...value, amount: next })}
        />
        <TextField
          label="currency"
          value={value.currency}
          onChange={(next) => onChange({ ...value, currency: next })}
        />
        <TextField
          label="days_overdue"
          type="number"
          value={value.days_overdue}
          onChange={(next) => onChange({ ...value, days_overdue: next })}
        />
      </div>
    );
  }

  if (item.event.source === "campaignops") {
    const value = form as CampaignEditForm;

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="client"
            value={value.client}
            onChange={(next) => onChange({ ...value, client: next })}
          />
          <TextField
            label="deadline"
            type="date"
            value={value.deadline}
            onChange={(next) => onChange({ ...value, deadline: next })}
          />
          <TextField
            label="campaign_goal"
            value={value.campaign_goal}
            onChange={(next) => onChange({ ...value, campaign_goal: next })}
          />
        </div>
        <div>
          <p className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            channels
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {campaignChannels.map((channel) => (
              <label
                key={channel}
                className="flex items-center gap-3 rounded-[7px] border border-[#d1d5db] bg-white px-3 py-2.5 text-sm text-[var(--text)]"
              >
                <input
                  type="checkbox"
                  checked={value.channels.includes(channel)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...value.channels, channel]
                      : value.channels.filter((entry) => entry !== channel);

                    onChange({ ...value, channels: next });
                  }}
                />
                <span>{channel}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const value = form as GuestEditForm;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        label="reservation_id"
        value={value.reservation_id}
        onChange={(next) => onChange({ ...value, reservation_id: next })}
      />
      <TextField
        label="guest_name"
        value={value.guest_name}
        onChange={(next) => onChange({ ...value, guest_name: next })}
      />
      <TextField
        label="current_check_in"
        type="date"
        value={value.current_check_in}
        onChange={(next) => onChange({ ...value, current_check_in: next })}
      />
      <TextField
        label="requested_check_in"
        type="date"
        value={value.requested_check_in}
        onChange={(next) => onChange({ ...value, requested_check_in: next })}
      />
      <TextField
        label="nights"
        type="number"
        value={value.nights}
        onChange={(next) => onChange({ ...value, nights: next })}
      />
    </div>
  );
}

function createEditForm(item: ReviewListItem): EditForm {
  const payload = asRecord(item.event.payload);

  if (item.event.source === "financeops") {
    return {
      invoice_id: asString(payload?.invoice_id),
      customer_name: asString(payload?.customer_name),
      amount: asNumberString(payload?.amount),
      currency: asString(payload?.currency),
      days_overdue: asNumberString(payload?.days_overdue),
    };
  }

  if (item.event.source === "campaignops") {
    return {
      client: asString(payload?.client),
      campaign_goal: asString(payload?.campaign_goal),
      channels: Array.isArray(payload?.channels)
        ? payload.channels.filter((entry): entry is string => typeof entry === "string")
        : [],
      deadline: asString(payload?.deadline),
    };
  }

  return {
    reservation_id: asString(payload?.reservation_id),
    guest_name: asString(payload?.guest_name),
    current_check_in: asString(payload?.current_check_in),
    requested_check_in: asString(payload?.requested_check_in),
    nights: asNumberString(payload?.nights),
  };
}

function buildPayload(item: ReviewListItem, form: EditForm) {
  if (item.event.source === "financeops") {
    const value = form as FinanceEditForm;

    return {
      invoice_id: value.invoice_id,
      customer_name: value.customer_name,
      amount: toNumberOrUndefined(value.amount),
      currency: value.currency,
      days_overdue: toNumberOrUndefined(value.days_overdue),
    };
  }

  if (item.event.source === "campaignops") {
    const value = form as CampaignEditForm;

    return {
      client: value.client,
      campaign_goal: value.campaign_goal,
      channels: value.channels,
      deadline: value.deadline,
    };
  }

  const value = form as GuestEditForm;

  return {
    reservation_id: value.reservation_id,
    guest_name: value.guest_name,
    current_check_in: value.current_check_in,
    requested_check_in: value.requested_check_in,
    nights: toNumberOrUndefined(value.nights),
  };
}

function asRecord(value: JsonValue | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function asString(value: JsonValue | undefined) {
  return typeof value === "string" ? value : "";
}

function asNumberString(value: JsonValue | undefined) {
  return typeof value === "number" ? String(value) : "";
}

function toNumberOrUndefined(value: string) {
  return value.trim().length === 0 ? undefined : Number(value);
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        className="w-full px-3 py-2.5 text-sm"
      />
    </label>
  );
}

function SummaryStat({
  label,
  value,
  code = false,
}: {
  label: string;
  value: string;
  code?: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[#f9fafb] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </p>
      {code ? (
        <code className="mt-2 inline-flex rounded bg-white px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
          {value}
        </code>
      ) : (
        <p className="mt-2 text-sm font-medium text-[var(--text)]">{value}</p>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
