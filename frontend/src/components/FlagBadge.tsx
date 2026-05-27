interface FlagBadgeProps {
  status: "none" | "warning" | "alert";
  reason?: string;
}

export default function FlagBadge({ status, reason }: FlagBadgeProps) {
  if (status === "none") return null;

  const styles =
    status === "alert"
      ? "bg-red-100 text-red-700 border border-red-200"
      : "bg-amber-100 text-amber-700 border border-amber-200";

  const label = status === "alert" ? "Alert" : "Warning";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
      title={reason}
    >
      <span>{status === "alert" ? "🔴" : "🟡"}</span>
      {label}
    </span>
  );
}
