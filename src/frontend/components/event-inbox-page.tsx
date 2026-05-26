"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { fetchEvents, operationsRefreshEvent } from "@/lib/dashboard/client";
import { getEventOverview, getWorkflowLabel } from "@/lib/dashboard/presenters";
import type { EventRecord, EventsResponse } from "@/lib/dashboard/types";

export default function EventInboxPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = (await fetchEvents()) as EventsResponse;
        if (!active) return;
        setEvents(data.events);
        setLoading(false);
        setError(null);
      } catch (error) {
        if (!active) return;
        setLoading(false);
        setError(error instanceof Error ? error.message : "Unable to load event inbox");
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

  const filteredEvents = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const matchesSource = sourceFilter === "all" || event.source === sourceFilter;
      const matchesSearch =
        needle.length === 0 ||
        event.source_event_id.toLowerCase().includes(needle) ||
        event.event_type.toLowerCase().includes(needle) ||
        event.source.toLowerCase().includes(needle);

      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [events, searchTerm, sourceFilter, statusFilter]);

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-[var(--border)] bg-white p-8 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.9)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Event Inbox
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
          A simpler event inbox
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
          Browse incoming workflows, narrow the view with a few filters, and open the ones that need a closer look.
        </p>
      </section>

      <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.9)]">
        <div className="grid gap-4 lg:grid-cols-4">
          <ToolbarField label="Search">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="event id, source, type"
              className="w-full px-3 py-2.5 text-sm"
            />
          </ToolbarField>
          <ToolbarField label="Status">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full px-3 py-2.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="received">received</option>
              <option value="processing">processing</option>
              <option value="completed">completed</option>
              <option value="review_required">review_required</option>
              <option value="failed">failed</option>
            </select>
          </ToolbarField>
          <ToolbarField label="Source">
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="w-full px-3 py-2.5 text-sm"
            >
              <option value="all">All sources</option>
              <option value="financeops">financeops</option>
              <option value="campaignops">campaignops</option>
              <option value="guestops">guestops</option>
            </select>
          </ToolbarField>
          <ToolbarField label="Results">
            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--text-secondary)]">
              {loading ? "Loading..." : `${filteredEvents.length} events`}
            </div>
          </ToolbarField>
        </div>

        {error ? (
          <div className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        ) : null}

        <div className="mt-5">
          <DataTable
            rows={filteredEvents}
            empty={
              <div>
                No events match the current filters.{" "}
                <Link href="/submit" className="font-medium text-[#2563eb]">
                  Submit a new event
                </Link>
                .
              </div>
            }
            columns={[
              {
                key: "id",
                header: "Event ID",
                cell: (event) => (
                  <code className="inline-flex rounded bg-[#f3f4f6] px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
                    {event.source_event_id}
                  </code>
                ),
              },
              {
                key: "source",
                header: "Source",
                cell: (event) => (
                  <div>
                    <span className="font-medium text-[var(--text)]">{getWorkflowLabel(event)}</span>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {getEventOverview(event)}
                    </p>
                  </div>
                ),
              },
              {
                key: "type",
                header: "Event type",
                cell: (event) => <span className="text-[var(--text)]">{event.event_type}</span>,
              },
              {
                key: "status",
                header: "Status",
                cell: (event) => <StatusBadge status={event.status} />,
              },
              {
                key: "actions",
                header: "Actions",
                cell: (event) => String(event.actions.length),
              },
              {
                key: "created",
                header: "Created",
                cell: (event) => formatDate(event.created_at),
              },
              {
                key: "open",
                header: "Open",
                cell: (event) => (
                  <Link href={`/events/${event.id}`} className="font-medium text-[#2563eb]">
                    View detail
                  </Link>
                ),
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function ToolbarField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </span>
      {children}
    </label>
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
