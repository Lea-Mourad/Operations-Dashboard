"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import AuditTimeline from "@/components/AuditTimeline";
import DataTable from "@/components/DataTable";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { fetchDashboard, fetchEvents, fetchReviews, operationsRefreshEvent } from "@/lib/dashboard/client";
import { getEventOverview, getWorkflowLabel } from "@/lib/dashboard/presenters";
import type {
  AuditLogRecord,
  DashboardResponse,
  EventRecord,
  EventsResponse,
  ReviewListItem,
  ReviewsResponse,
} from "@/lib/dashboard/types";

type DashboardState = {
  events: EventRecord[];
  reviewItems: ReviewListItem[];
  dashboard: DashboardResponse | null;
  loading: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  events: [],
  reviewItems: [],
  dashboard: null,
  loading: true,
  error: null,
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [eventsData, reviewsData, dashboardData] = (await Promise.all([
          fetchEvents(),
          fetchReviews(),
          fetchDashboard(),
        ])) as [EventsResponse, ReviewsResponse, DashboardResponse];

        if (!active) return;

        setState({
          events: eventsData.events,
          reviewItems: reviewsData.reviewItems,
          dashboard: dashboardData,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;

        setState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load dashboard data",
        }));
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [refreshCount]);

  useEffect(() => {
    function handleRefresh() {
      setState((current) => ({ ...current, loading: true, error: null }));
      setRefreshCount((count) => count + 1);
    }

    window.addEventListener(operationsRefreshEvent, handleRefresh);
    return () => window.removeEventListener(operationsRefreshEvent, handleRefresh);
  }, []);

  const totalEvents = state.dashboard?.summary.total_events ?? state.events.length;
  const completed =
    state.dashboard?.events_by_status.find((item) => item.status === "completed")
      ?.count ?? 0;
  const reviewRequired =
    state.dashboard?.events_by_status.find(
      (item) => item.status === "review_required",
    )?.count ?? 0;
  const failed =
    state.dashboard?.events_by_status.find((item) => item.status === "failed")
      ?.count ?? 0;
  const totalActions =
    state.dashboard?.summary.total_actions ??
    state.events.reduce((sum, event) => sum + event.actions.length, 0);

  const recentEvents = state.events.slice(0, 6);

  const recentAudit = useMemo<AuditLogRecord[]>(() => {
    return state.events
      .flatMap((event) => event.audit_logs)
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      )
      .slice(0, 5);
  }, [state.events]);

  return (
    <div className="space-y-6">
      <section className="rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-5 md:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Operations
            </p>
            <h1 className="mt-2 text-[22px] font-bold tracking-[-0.5px] text-[var(--text)]">
              Operations overview
            </h1>
            <p className="mt-2 max-w-2xl text-[12px] font-medium leading-5 text-[var(--text-secondary)]">
              See recent activity, check outcomes, and step in only when something needs attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/submit" className="rounded-[10px] bg-[var(--primary)] px-4 py-2 text-[12px] font-semibold text-white">
              Submit event
            </Link>
            <Link href="/events" className="rounded-[10px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[12px] font-semibold text-[var(--text)]">
              Open inbox
            </Link>
          </div>
        </div>
        {state.error ? (
          <div className="mt-4 rounded-[12px] border-[0.5px] border-[var(--error-bg)] bg-[var(--error-bg)] px-4 py-3 text-[12px] font-medium text-[var(--error-text)]">
            {state.error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total events"
          value={state.loading ? "..." : String(totalEvents)}
          helper="All persisted workflow events"
          accent="blue"
        />
        <MetricCard
          label="Completed"
          value={state.loading ? "..." : String(completed)}
          helper="Successfully processed events"
          accent="green"
        />
        <MetricCard
          label="Review required"
          value={state.loading ? "..." : String(reviewRequired)}
          helper="Operator intervention needed"
          accent="amber"
        />
        <MetricCard
          label="Failed"
          value={state.loading ? "..." : String(failed)}
          helper="Workflow failures across streams"
          accent="red"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SimpleStep
          number="01"
          title="Send an event"
          body="Start from the submit page and use the prefilled forms to send a new event."
          href="/submit"
          linkLabel="Open Submit Event"
        />
        <SimpleStep
          number="02"
          title="Check the outcome"
          body="The inbox shows whether an event completed, failed, or needs review. Open any event to see what happened."
          href="/events"
          linkLabel="Open Event Inbox"
        />
        <SimpleStep
          number="03"
          title="Fix blocked items"
          body="If something cannot be handled safely, it lands in the review queue where you can fix and reprocess it."
          href="/reviews"
          linkLabel="Open Review Queue"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-[14px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Recent events
              </p>
              <h2 className="mt-1 text-[18px] font-bold tracking-[-0.3px] text-[var(--text)]">Recent activity</h2>
            </div>
            <span className="rounded-full border-[0.5px] border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
              {totalActions} actions generated
            </span>
          </div>

          <DataTable
            rows={recentEvents}
            empty="No events have been submitted yet."
            columns={[
              {
                key: "source",
                header: "Source",
                cell: (event) => (
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--text)]">{getWorkflowLabel(event)}</div>
                    <code className="mt-1 inline-flex rounded-[8px] bg-[var(--surface-muted)] px-2 py-1 font-mono text-[11px] text-[var(--text-secondary)]">
                      {event.source_event_id}
                    </code>
                    <div className="mt-2 text-[12px] font-medium text-[var(--text-secondary)]">
                      {getEventOverview(event)}
                    </div>
                  </div>
                ),
              },
              {
                key: "type",
                header: "Event type",
                cell: (event) => <span className="text-[12px] font-medium text-[var(--text)]">{event.event_type}</span>,
              },
              {
                key: "status",
                header: "Status",
                cell: (event) => <StatusBadge status={event.status} />,
              },
              {
                key: "created",
                header: "Created",
                cell: (event) => formatDate(event.created_at),
              },
              {
                key: "detail",
                header: "Detail",
                cell: (event) => (
                  <Link href={`/events/${event.id}`} className="text-[12px] font-semibold text-[var(--primary)]">
                    Open
                  </Link>
                ),
              },
            ]}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-[14px]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Review queue
                </p>
                <h2 className="mt-1 text-[18px] font-bold tracking-[-0.3px] text-[var(--text)]">Needs attention</h2>
              </div>
              <Link href="/reviews" className="text-[12px] font-semibold text-[var(--primary)]">
                Manage queue
              </Link>
            </div>
            <div className="space-y-3">
              {state.reviewItems.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--text)]">
                        {getWorkflowLabel({
                          source: item.event.source,
                          event_type: item.event.event_type,
                        })}
                      </p>
                      <p className="mt-1 text-[12px] font-medium text-[var(--text-secondary)]">
                        {item.reason}
                      </p>
                      <code className="mt-2 inline-flex rounded-[8px] bg-[var(--surface-muted)] px-2 py-1 font-mono text-[11px] text-[var(--text-secondary)]">
                        {item.event.source_event_id}
                      </code>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
              {state.reviewItems.length === 0 ? (
                <div className="rounded-[12px] border-[0.5px] border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-8 text-[12px] font-medium text-[var(--text-secondary)]">
                  No review items are currently open.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-[14px]">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Recent activity
              </p>
              <h2 className="mt-1 text-[18px] font-bold tracking-[-0.3px] text-[var(--text)]">Latest workflow updates</h2>
            </div>
            <AuditTimeline items={recentAudit} />
          </div>
        </div>
      </section>
    </div>
  );
}

function SimpleStep({
  number,
  title,
  body,
  href,
  linkLabel,
}: {
  number: string;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <section className="rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-[14px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        Step {number}
      </p>
      <h2 className="mt-3 text-[18px] font-bold leading-6 tracking-[-0.3px] text-[var(--text)]">{title}</h2>
      <p className="mt-3 text-[12px] font-medium leading-6 text-[var(--text-secondary)]">{body}</p>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--primary)]">
        <span>{linkLabel}</span>
        <span aria-hidden="true">→</span>
      </Link>
    </section>
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
