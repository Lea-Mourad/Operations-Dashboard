"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/submit", label: "Submit Event" },
  { href: "/events", label: "Event Inbox" },
  { href: "/reviews", label: "Review Queue" },
  { href: "/audit", label: "Audit Trail" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-[200px] border-r border-[var(--border)] bg-[var(--sidebar-bg)]">
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-semibold text-white">
              OC
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">OpsCenter</p>
              <p className="text-xs text-[var(--text-muted)]">Operations</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="grid gap-1.5">
            {navigationItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center rounded-[10px] px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-[#eff6ff] text-[#1d4ed8]"
                      : "text-[var(--text-secondary)] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {active ? (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#2563eb]" />
                  ) : null}
                  <span className={`${active ? "pl-2" : "pl-0"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[#3fb950]" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
