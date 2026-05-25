type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  accent?: "blue" | "green" | "amber" | "red" | "neutral";
};

const accents: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  blue: "border-t-[#2563eb]",
  green: "border-t-[#3fb950]",
  amber: "border-t-[#d29922]",
  red: "border-t-[#f85149]",
  neutral: "border-t-[#d1d5db]",
};

export default function MetricCard({
  label,
  value,
  helper,
  accent = "neutral",
}: MetricCardProps) {
  return (
    <div className={`rounded-[10px] border border-[var(--border)] border-t-2 ${accents[accent]} bg-white p-5 transition hover:shadow-sm`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-3 text-[28px] font-bold leading-none text-[var(--text)]">{value}</p>
      {helper ? (
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{helper}</p>
      ) : null}
    </div>
  );
}
