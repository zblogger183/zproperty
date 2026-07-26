import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  urgent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  urgent?: boolean;
}) {
  const content = (
    <div
      className={`cursor-pointer rounded-xl border bg-white p-4 transition hover:border-secondary ${
        urgent ? "border-2 border-secondary" : "border-primary"
      }`}
    >
      <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
      <p className="text-2xl font-bold text-black">{value}</p>
      <p className="mt-0.5 text-xs text-primary-mid">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
