interface StatusBadgeProps {
  status: "active" | "pending" | "disabled";
}

const colorMap = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  disabled: "bg-slate-100 text-slate-500",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorMap[status]}`}
    >
      {status}
    </span>
  );
}
