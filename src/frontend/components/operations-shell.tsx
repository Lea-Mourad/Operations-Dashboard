import AppShell from "@/components/AppShell";

export default function OperationsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
