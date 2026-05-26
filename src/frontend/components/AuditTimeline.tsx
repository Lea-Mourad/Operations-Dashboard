import type { AuditLogRecord } from "@/lib/dashboard/types";

import { summarizeAuditMetadata } from "@/lib/dashboard/presenters";

export default function AuditTimeline({
  items,
}: {
  items: AuditLogRecord[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[12px] border-[0.5px] border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-5 py-8 text-[12px] font-medium text-[var(--text-secondary)]">
        No audit entries recorded.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4">
          <div className="relative flex w-5 justify-center">
            <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
            {index < items.length - 1 ? (
              <span className="absolute top-4 bottom-[-18px] w-px bg-[var(--border)]" />
            ) : null}
          </div>
          <div className="flex-1 rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] font-semibold text-[var(--text)]">{item.message}</p>
              <p className="text-[11px] font-medium text-[var(--text-muted)]">{formatDate(item.created_at)}</p>
            </div>
            {item.metadata ? (
              <p className="mt-2 text-[12px] font-medium text-[var(--text-secondary)]">
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
