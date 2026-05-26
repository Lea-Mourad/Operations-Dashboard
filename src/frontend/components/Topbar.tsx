"use client";

import { usePathname } from "next/navigation";

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/submit")) return "Submit Event";
  if (pathname.startsWith("/events/")) return "Event Detail";
  if (pathname.startsWith("/events")) return "Event Inbox";
  if (pathname.startsWith("/reviews")) return "Review Queue";
  if (pathname.startsWith("/forntend")) return "Dashboard";
  return "Dashboard";
}

export default function Topbar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b-[0.5px] border-[var(--border)] bg-[color:var(--surface)] px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] font-medium">
        <span className="text-[var(--text-secondary)]">Operations</span>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="font-semibold text-[var(--primary)]">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-2 rounded-full border-[0.5px] border-[var(--success-bg)] bg-[var(--success-bg)] px-3 py-1.5 text-[var(--success-text)]">
          <span className="h-2 w-2 rounded-full bg-[var(--success-text)]" />
          API connected
        </span>
        <span className="rounded-full border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 uppercase tracking-[0.04em] text-[var(--text-secondary)]">
          production
        </span>
      </div>
    </header>
  );
}
