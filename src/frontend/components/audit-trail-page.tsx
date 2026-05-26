"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { fetchAudit, operationsRefreshEvent } from "@/lib/dashboard/client";
import { summarizeAuditMetadata } from "@/lib/dashboard/presenters";
import type { AuditListItem, AuditResponse } from "@/lib/dashboard/types";

export default function AuditTrailPage() {
  const [auditItems, setAuditItems] = useState<AuditListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = (await fetchAudit()) as AuditResponse;
        if (!active) return;
        setAuditItems(data.auditItems);
        setLoading(false);
        setError(null);
      } catch (error) {
        if (!active) return;
        setLoading(false);
        setError(error instanceof Error ? error.message : "Unable to load audit trail");
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

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return auditItems.filter((row) => {
      const matchesSource = sourceFilter === "all" || row.event.source === sourceFilter;
      const matchesSearch =
        needle.length === 0 ||
        row.message.toLowerCase().includes(needle) ||
        row.event.source_event_id.toLowerCase().includes(needle) ||
        row.event.event_type.toLowerCase().includes(needle);
      return matchesSource && matchesSearch;
    });
  }, [auditItems, searchTerm, sourceFilter]);

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-[var(--border)] bg-white p-8 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.9)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Audit Trail
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
          A simple timeline of what the system has done
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
          Use this page when you want the history only. It shows the sequence of system activity without opening each event one by one.
        </p>
      </section>

      <section className="rounded-[10px] border border-[var(--border)] bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <ToolbarField label="Search">
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="message, event id, type" className="w-full px-3 py-2.5 text-sm" />
          </ToolbarField>
          <ToolbarField label="Source">
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="w-full px-3 py-2.5 text-sm">
              <option value="all">All sources</option>
              <option value="financeops">financeops</option>
              <option value="campaignops">campaignops</option>
              <option value="guestops">guestops</option>
            </select>
          </ToolbarField>
          <ToolbarField label="Entries">
            <div className="rounded-[7px] border border-[var(--border)] bg-[#f9fafb] px-3 py-2.5 text-sm text-[var(--text-secondary)]">
              {loading ? "Loading..." : `${filtered.length} entries`}
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
            rows={filtered}
            empty="No audit entries match the current filters."
            columns={[
              {
                key: "time",
                header: "Timestamp",
                cell: (row) => formatDate(row.created_at),
              },
              {
                key: "event",
                header: "Event ID",
                cell: (row) => (
                  <div>
                    <code className="inline-flex rounded bg-[#f3f4f6] px-2 py-1 font-mono text-xs text-[var(--text-secondary)]">
                      {row.event.source_event_id}
                    </code>
                    <div className="mt-2 capitalize text-[var(--text-secondary)]">{row.event.source}</div>
                  </div>
                ),
              },
              {
                key: "message",
                header: "Message",
                cell: (row) => <span className="text-[var(--text)]">{row.message}</span>,
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => <StatusBadge status={row.event.status} />,
              },
              {
                key: "metadata",
                header: "Details",
                cell: (row) => (
                  <div className="max-w-[300px] text-sm text-[var(--text-secondary)]">
                    {summarizeAuditMetadata(row)}
                  </div>
                ),
              },
              {
                key: "open",
                header: "Open",
                cell: (row) => (
                  <Link href={`/events/${row.event.id}`} className="font-medium text-[#2563eb]">
                    View
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
