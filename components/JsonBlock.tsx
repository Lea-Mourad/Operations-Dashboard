import type { JsonValue } from "@/lib/dashboard/types";

export default function JsonBlock({ value }: { value: JsonValue }) {
  const pretty = JSON.stringify(value, null, 2);

  return (
    <pre className="overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[#f9fafb] p-4 text-sm leading-6 text-[var(--text)]">
      <code className="font-mono">{pretty}</code>
    </pre>
  );
}
