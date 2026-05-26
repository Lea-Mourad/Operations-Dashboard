"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <Sidebar />
      <div className="ml-[200px] min-h-screen">
        <Topbar />
        <main className="px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
