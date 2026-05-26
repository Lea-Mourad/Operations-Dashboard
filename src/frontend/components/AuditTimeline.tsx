import type { AuditLogRecord } from "@/lib/dashboard/types";

import { summarizeAuditMetadata } from "@/lib/dashboard/presenters";

export default function AuditTimeline({
  items,
}: {
  items: AuditLogRecord[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[var(--border)] bg-[#fafafa] px-5 py-8 text-sm text-[var(--text-secondary)]">
        No audit entries recorded.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4">
          <div className="relative flex w-5 justify-center">
            <span className="mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#2563eb] shadow-sm" />
            {index < items.length - 1 ? (
              <span className="absolute top-5 bottom-[-22px] w-px bg-[var(--border)]" />
            ) : null}
          </div>
          <div className="flex-1 rounded-[10px] border border-[var(--border)] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--text)]">{item.message}</p>
              <p className="text-xs text-[var(--text-muted)]">{formatDate(item.created_at)}</p>
            </div>
            {item.metadata ? (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {summarizeAuditMetadata(item)}
              </p>
            ) : null}
          </div>
        </div>
      ))}
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
