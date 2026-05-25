"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AuditTimeline from "@/components/AuditTimeline";
import DataTable from "@/components/DataTable";
import JsonBlock from "@/components/JsonBlock";
import StatusBadge from "@/components/StatusBadge";
import { fetchEvent, operationsRefreshEvent } from "@/lib/dashboard/client";
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

  return (
    <div className="space-y-6">
      <section className="rounded-[10px] border border-[var(--border)] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Event Detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
              {event.event_type}
            </h1>
            <code className="mt-3 inline-flex rounded bg-[#f3f4f6] px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
              {event.source_event_id}
            </code>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card title="Summary">
            <div className="grid gap-4 md:grid-cols-2">
              <MetaStat label="Source" value={event.source} />
              <MetaStat label="Status" value={event.status} />
              <MetaStat label="Actions" value={String(event.actions.length)} />
              <MetaStat label="Audit entries" value={String(event.audit_logs.length)} />
              <MetaStat label="Created" value={formatDate(event.created_at)} />
              <MetaStat label="Updated" value={formatDate(event.updated_at)} />
            </div>
          </Card>

          {reviewItem ? (
            <Card title="Review reason">
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

          <Card title="Raw payload">
            <JsonBlock value={event.payload} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Generated actions">
            <DataTable
              rows={event.actions}
              empty="No actions were generated for this event."
              columns={[
                {
                  key: "type",
                  header: "Action type",
                  cell: (action) => (
                    <code className="inline-flex rounded bg-[#f3f4f6] px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
                      {action.type}
                    </code>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (action) => <StatusBadge status={action.status} />,
                },
                {
                  key: "created",
                  header: "Created",
                  cell: (action) => formatDate(action.created_at),
                },
                {
                  key: "payload",
                  header: "Payload",
                  cell: (action) => (
                    <div className="max-w-[320px]">
                      <JsonBlock value={action.payload} />
                    </div>
                  ),
                },
              ]}
            />
          </Card>

          <Card title="Audit timeline">
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

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[#f9fafb] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{value}</p>
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
