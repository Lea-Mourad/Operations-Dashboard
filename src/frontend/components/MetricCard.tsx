type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  accent?: "blue" | "green" | "amber" | "red" | "neutral";
};

const accents: Record<
  NonNullable<MetricCardProps["accent"]>,
  { dot: string; value: string }
> = {
  blue: { dot: "bg-[var(--primary)]", value: "text-[var(--primary)]" },
  green: { dot: "bg-[var(--success-text)]", value: "text-[var(--success-text)]" },
  amber: { dot: "bg-[var(--warning-text)]", value: "text-[var(--warning-text)]" },
  red: { dot: "bg-[var(--error-text)]", value: "text-[var(--error-text)]" },
  neutral: { dot: "bg-[var(--neutral-text)]", value: "text-[var(--text)]" },
};

export default function MetricCard({
  label,
  value,
  helper,
  accent = "neutral",
}: MetricCardProps) {
  return (
    <div className="rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-[14px]">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${accents[accent].dot}`} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          {label}
        </p>
      </div>
      <p className={`mt-3 text-[28px] font-bold leading-none ${accents[accent].value}`}>{value}</p>
      {helper ? (
        <p className="mt-2 max-w-[22ch] text-[11px] leading-5 text-[var(--text-muted)]">{helper}</p>
      ) : null}
    </div>
  );
}
