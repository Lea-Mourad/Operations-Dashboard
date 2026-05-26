"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import StatusBadge from "@/components/StatusBadge";
import {
  emitOperationsRefresh,
  fetchReviews,
  operationsRefreshEvent,
  resolveReview,
} from "@/lib/dashboard/client";
import { getWorkflowLabel } from "@/lib/dashboard/presenters";
import type { ReviewListItem, ReviewsResponse } from "@/lib/dashboard/types";

export default function ReviewQueuePage() {
  const [reviewItems, setReviewItems] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
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

  return (
    <div className="space-y-6">
      <section className="rounded-[10px] border border-[var(--border)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Review Queue
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
          Exceptions requiring operator action
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
          Resolve blocked automation with notes while preserving the event and audit trail.
        </p>
      </section>

      {error ? (
        <div className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      {reviewItems.length === 0 && !loading ? (
        <div className="rounded-[10px] border border-[var(--border)] bg-white px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
          No review items are currently open.
        </div>
      ) : null}

      <div className="space-y-4">
        {reviewItems.map((item) => (
          <section
            key={item.id}
            className={`rounded-[10px] border border-[var(--border)] bg-white p-5 ${item.status === "completed" ? "opacity-65" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {getWorkflowLabel({
                    source: item.event.source,
                    event_type: item.event.event_type,
                  })}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">{item.event.event_type}</h2>
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
              <SummaryStat
                label="Resolved"
                value={item.resolved_at ? formatDate(item.resolved_at) : "Pending"}
              />
            </div>

            <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[#f9fafb] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Quick action summary
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Event status is currently <span className="font-medium text-[var(--text)]">{item.event.status}</span>. Review this workflow and resolve it with operator notes once the issue has been handled.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px_160px]">
              <textarea
                value={notes[item.id] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }))
                }
                placeholder="Resolution notes"
                className="min-h-[96px] w-full px-3 py-2.5 text-sm"
              />
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
                {resolvingId === item.id ? "Resolving..." : "Resolve"}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
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
