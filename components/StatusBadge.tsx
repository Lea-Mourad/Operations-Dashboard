type StatusBadgeProps = {
  status: string;
  className?: string;
};

const styles: Record<string, string> = {
  completed: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  review_required: "border-[#fde68a] bg-[#fffbeb] text-[#b45309]",
  failed: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
  processing: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  received: "border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280]",
};

const dots: Record<string, string> = {
  completed: "bg-[#3fb950]",
  review_required: "bg-[#d29922]",
  failed: "bg-[#f85149]",
  processing: "bg-[#58a6ff]",
  received: "bg-[#9ca3af]",
};

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  const key = status in styles ? status : "received";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium lowercase ${styles[key]} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dots[key]}`} />
      {status}
    </span>
  );
}
