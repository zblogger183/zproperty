"use client";

import {
  Home,
  KeyRound,
  Building2,
  Layers,
  DoorOpen,
  Map,
  Briefcase,
  Leaf,
  Monitor,
  ShoppingBag,
  Package,
  Building,
  type LucideIcon,
} from "lucide-react";
import type { Step1Data } from "@/app/dashboard/listings/schemas";
import { errorClass } from "./styles";

const PURPOSE_OPTIONS: { value: Step1Data["purpose"]; label: string; sublabel: string; Icon: LucideIcon }[] = [
  { value: "buy", label: "Buy", sublabel: "Purchase property", Icon: Home },
  { value: "rent", label: "Rent", sublabel: "Rent a property", Icon: KeyRound },
];

const TYPE_OPTIONS: { value: Step1Data["type"]; label: string; Icon: LucideIcon }[] = [
  { value: "house", label: "House", Icon: Home },
  { value: "flat", label: "Flat / Apartment", Icon: Building2 },
  { value: "upper_portion", label: "Upper Portion", Icon: Layers },
  { value: "lower_portion", label: "Lower Portion", Icon: Layers },
  { value: "room", label: "Room", Icon: DoorOpen },
  { value: "residential_plot", label: "Residential Plot", Icon: Map },
  { value: "commercial_plot", label: "Commercial Plot", Icon: Briefcase },
  { value: "agricultural_land", label: "Agricultural Land", Icon: Leaf },
  { value: "office", label: "Office", Icon: Monitor },
  { value: "shop", label: "Shop", Icon: ShoppingBag },
  { value: "warehouse", label: "Warehouse", Icon: Package },
  { value: "building", label: "Building", Icon: Building },
];

export function Step1Type({
  data,
  errors,
  onChange,
}: {
  data: Partial<Step1Data>;
  errors: Record<string, string>;
  onChange: (data: Partial<Step1Data>) => void;
}) {
  return (
    <div>
      <div className="flex gap-4">
        {PURPOSE_OPTIONS.map((option) => {
          const selected = data.purpose === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ purpose: option.value })}
              style={selected ? { backgroundColor: "rgba(180,231,23,0.08)" } : undefined}
              className={`flex-1 rounded-xl border-2 p-5 text-center transition ${
                selected ? "border-secondary" : "border-primary"
              }`}
            >
              <option.Icon className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-black">{option.label}</p>
              <p className="mt-1 text-xs text-primary-mid">{option.sublabel}</p>
            </button>
          );
        })}
      </div>
      {errors.purpose && <p className={errorClass}>⚠ {errors.purpose}</p>}

      <h3 className="mt-6 text-base font-bold text-black">What type of property?</h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {TYPE_OPTIONS.map((option) => {
          const selected = data.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ type: option.value })}
              className={`rounded-xl border p-3 text-center transition hover:border-secondary ${
                selected ? "border-2 border-secondary" : "border-primary"
              }`}
            >
              <option.Icon className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-1.5 text-xs font-medium text-black">{option.label}</p>
            </button>
          );
        })}
      </div>
      {errors.type && <p className={errorClass}>⚠ {errors.type}</p>}
    </div>
  );
}
