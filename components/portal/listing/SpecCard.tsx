import { Bath, Bed, Building2, Car, Ruler, Sofa, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  bed: Bed,
  bath: Bath,
  ruler: Ruler,
  car: Car,
  building: Building2,
  sofa: Sofa,
};

export function SpecCard({
  icon,
  value,
  label,
}: {
  icon: keyof typeof ICONS;
  value: string | number;
  label: string;
}) {
  const Icon = ICONS[icon];

  return (
    <div className="rounded-lg border border-primary bg-white p-3 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
      <p className="mt-1 text-sm font-bold text-black">{value}</p>
      <p className="text-xs text-primary-mid">{label}</p>
    </div>
  );
}
