"use client";

import { usePathname } from "next/navigation";

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/submit")) return "Submit Event";
  if (pathname.startsWith("/events/")) return "Event Detail";
  if (pathname.startsWith("/events")) return "Event Inbox";
  if (pathname.startsWith("/reviews")) return "Review Queue";
  if (pathname.startsWith("/audit")) return "Audit Trail";
  if (pathname.startsWith("/forntend")) return "Dashboard";
  return "Dashboard";
}

export default function Topbar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-[var(--border)] bg-[rgba(246,245,242,0.88)] px-8 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--text-secondary)]">Operations</span>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="font-medium text-[var(--text)]">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3 text-xs font-medium">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d9edd8] bg-white px-3 py-1.5 text-[#15803d]">
          <span className="h-2 w-2 rounded-full bg-[#3fb950]" />
          API connected
        </span>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[var(--text-secondary)]">
          production
        </span>
      </div>
    </header>
  );
}
