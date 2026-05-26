"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "Dashboard", icon: GridIcon },
  { href: "/submit", label: "Submit Event", icon: SendIcon },
  { href: "/events", label: "Event Inbox", icon: InboxIcon },
  { href: "/reviews", label: "Review Queue", icon: EyeIcon },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-[200px] border-r-[0.5px] border-[var(--border)] bg-[var(--sidebar-bg)]">
      <div className="flex h-full flex-col">
        <div className="border-b-[0.5px] border-[var(--border)] px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-bold text-white">
              OC
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text)]">OpsCenter</p>
              <p className="text-[11px] font-medium text-[var(--text-muted)]">Operations</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5">
          <div className="grid gap-1.5">
            {navigationItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-medium ${
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {active ? (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[var(--primary)]" />
                  ) : null}
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t-[0.5px] border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)]">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--success-text)]" />
            <span>Systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 11.5 20 4l-5.8 16-2.9-6.2L4 11.5Z" />
      <path d="m11.3 13.8 4.3-4.3" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-13Z" />
      <path d="M5 14h4l1.7 2h2.6l1.7-2H19" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
