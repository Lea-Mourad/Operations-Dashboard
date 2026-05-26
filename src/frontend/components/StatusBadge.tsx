type StatusBadgeProps = {
  status: string;
  className?: string;
};

const styles: Record<string, string> = {
  completed: "border-[var(--success-bg)] bg-[var(--success-bg)] text-[var(--success-text)]",
  resolved: "border-[var(--success-bg)] bg-[var(--success-bg)] text-[var(--success-text)]",
  review_required: "border-[var(--warning-bg)] bg-[var(--warning-bg)] text-[var(--warning-text)]",
  failed: "border-[var(--error-bg)] bg-[var(--error-bg)] text-[var(--error-text)]",
  processing: "border-[var(--primary-soft)] bg-[var(--primary-soft)] text-[var(--primary)]",
  received: "border-[var(--neutral-bg)] bg-[var(--neutral-bg)] text-[var(--neutral-text)]",
};

const dots: Record<string, string> = {
  completed: "bg-[var(--success-text)]",
  resolved: "bg-[var(--success-text)]",
  review_required: "bg-[var(--warning-text)]",
  failed: "bg-[var(--error-text)]",
  processing: "bg-[var(--primary)]",
  received: "bg-[var(--neutral-text)]",
};

const labels: Record<string, string> = {
  completed: "DONE",
  resolved: "DONE",
  review_required: "REVIEW",
  failed: "FAILED",
  processing: "PROCESSING",
  received: "RECEIVED",
};

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  const key = status in styles ? status : "received";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-[0.5px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${styles[key]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[key]}`} />
      {labels[key] ?? status}
    </span>
  );
}
