"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AuditTimeline from "@/components/AuditTimeline";
import JsonBlock from "@/components/JsonBlock";
import StatusBadge from "@/components/StatusBadge";
import { fetchEvent, operationsRefreshEvent } from "@/lib/dashboard/client";
import {
  getActionDisplay,
  getEventPayloadDisplay,
  getWorkflowLabel,
} from "@/lib/dashboard/presenters";
import type { EventRecord, EventResponse } from "@/lib/dashboard/types";

export default function EventDetailPage({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = (await fetchEvent(eventId)) as EventResponse;
        if (!active) return;
        setEvent(data.event);
        setLoading(false);
        setError(null);
      } catch (error) {
        if (!active) return;
        setLoading(false);
        setError(error instanceof Error ? error.message : "Unable to load event detail");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [eventId, refreshCount]);

  useEffect(() => {
    function handleRefresh() {
      setLoading(true);
      setRefreshCount((count) => count + 1);
    }
    window.addEventListener(operationsRefreshEvent, handleRefresh);
    return () => window.removeEventListener(operationsRefreshEvent, handleRefresh);
  }, []);

  if (loading) {
    return <PageNotice text="Loading event detail..." />;
  }

  if (error || !event) {
    return <PageNotice text={error ?? "Event not found"} danger />;
  }

  const reviewItem = event.review_queue_items[0];
  const payloadDisplay = getEventPayloadDisplay(event);

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-[var(--border)] bg-white p-8 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.9)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Event Detail
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
              Here’s what happened with this event
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">
              Use this page to see what came in, what the system did, and whether anyone had to step in.
            </p>
            <code className="mt-4 inline-flex rounded bg-[#f3f4f6] px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
              {event.source_event_id}
            </code>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card title="What came in">
            <div className="grid gap-4 md:grid-cols-2">
              <MetaStat label="Source event ID" value={event.source_event_id} code />
              <MetaStat label="Workflow" value={getWorkflowLabel(event)} />
              <MetaStat label="Source" value={event.source} />
              <MetaStat label="Event type" value={event.event_type} />
              <MetaStat label="Created at" value={formatDate(event.created_at)} />
              <MetaStat label="Status" value={event.status} />
            </div>
          </Card>

          {reviewItem ? (
            <Card title="Why it needed attention">
              <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
                <p className="text-sm font-medium text-[#b45309]">{reviewItem.reason}</p>
                {reviewItem.resolution_notes ? (
                  <p className="mt-2 text-sm text-[#b45309]">
                    Resolution notes: {reviewItem.resolution_notes}
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          <Card title="Event details">
            <div className="grid gap-4 md:grid-cols-2">
              {payloadDisplay.fields.map((field) => (
                <MetaStat key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
            {payloadDisplay.tags && payloadDisplay.tags.length > 0 ? (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Channels
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {payloadDisplay.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-full border border-[#d1d5db] bg-[#f9fafb] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {payloadDisplay.priority ? (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Priority
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    payloadDisplay.priority === "High"
                      ? "border border-[#fde68a] bg-[#fffbeb] text-[#b45309]"
                      : "border border-[#d1d5db] bg-[#f9fafb] text-[var(--text-secondary)]"
                  }`}
                >
                  {payloadDisplay.priority}
                </span>
              </div>
            ) : null}
            <details className="mt-5 rounded-[10px] border border-[var(--border)] bg-[#f9fafb]">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-[#2563eb]">
                View raw payload
              </summary>
              <div className="border-t border-[var(--border)] p-4">
                <JsonBlock value={event.payload} />
              </div>
            </details>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="What the system did">
            {event.actions.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-[var(--border)] bg-[#fafafa] px-5 py-8 text-sm text-[var(--text-secondary)]">
                No actions were generated for this event.
              </div>
            ) : (
              <div className="space-y-3">
                {event.actions.map((action) => {
                  const actionDisplay = getActionDisplay(action);

                  return (
                    <div
                      key={action.id}
                      className="rounded-[10px] border border-[var(--border)] bg-[#fafafa] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--text)]">
                            {actionDisplay.title}
                          </h3>
                          {actionDisplay.message ? (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              {actionDisplay.message}
                            </p>
                          ) : null}
                        </div>
                        <StatusBadge status={action.status} />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {actionDisplay.fields.map((field) => (
                          <MetaStat key={`${action.id}-${field.label}`} label={field.label} value={field.value} />
                        ))}
                        <MetaStat label="Created" value={formatDate(action.created_at)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="History">
            <AuditTimeline items={event.audit_logs} />
          </Card>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/events" className="rounded-[7px] border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[var(--text)]">
          Back to inbox
        </Link>
        <Link href="/reviews" className="rounded-[7px] border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[var(--text)]">
          Open review queue
        </Link>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-[var(--border)] bg-white p-5">
      <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetaStat({
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

function PageNotice({
  text,
  danger = false,
}: {
  text: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] border p-6 text-sm ${
        danger
          ? "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
          : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
      }`}
    >
      {text}
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
