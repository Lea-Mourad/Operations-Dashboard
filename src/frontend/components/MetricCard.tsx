type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  accent?: "blue" | "green" | "amber" | "red" | "neutral";
};

const accents: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  blue: "bg-[#2563eb]",
  green: "bg-[#3fb950]",
  amber: "bg-[#d29922]",
  red: "bg-[#f85149]",
  neutral: "bg-[#d1d5db]",
};

export default function MetricCard({
  label,
  value,
  helper,
  accent = "neutral",
}: MetricCardProps) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-white p-6 shadow-[0_10px_26px_-26px_rgba(15,23,42,0.9)] transition hover:shadow-[0_16px_34px_-28px_rgba(15,23,42,0.9)]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${accents[accent]}`} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {label}
        </p>
      </div>
      <p className="mt-4 text-[30px] font-semibold leading-none text-[var(--text)]">{value}</p>
      {helper ? (
        <p className="mt-3 max-w-[22ch] text-sm leading-6 text-[var(--text-secondary)]">{helper}</p>
      ) : null}
    </div>
  );
}
