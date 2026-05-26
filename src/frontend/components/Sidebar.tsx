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
    <aside className="fixed inset-y-0 left-0 z-30 w-[216px] border-r border-[var(--border)] bg-[var(--sidebar-bg)]">
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border)] px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563eb] text-sm font-semibold text-white shadow-[0_12px_28px_-20px_rgba(37,99,235,0.9)]">
              OC
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">OpsCenter</p>
              <p className="text-xs text-[var(--text-muted)]">Operations</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <div className="grid gap-2">
            {navigationItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-white text-[#1d4ed8] shadow-[0_12px_26px_-24px_rgba(15,23,42,0.85)]"
                      : "text-[var(--text-secondary)] hover:bg-white"
                  }`}
                >
                  {active ? (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#2563eb]" />
                  ) : null}
                  <span className={`${active ? "pl-2" : "pl-0"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-[var(--border)] px-5 py-5">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[#3fb950]" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
