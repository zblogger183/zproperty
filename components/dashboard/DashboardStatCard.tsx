import type { LucideIcon } from "lucide-react";

export function DashboardStatCard({
  label,
  value,
  subLabel,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  subLabel?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-primary bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-primary-mid">{label}</p>
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-1 text-2xl font-bold text-black">
        {typeof value === "number" ? value.toLocaleString("en-PK") : value}
      </p>
      {subLabel && <p className="mt-0.5 text-xs text-primary-mid">{subLabel}</p>}
    </div>
  );
}
