"use client";

import type { Step1Data, Step3Data } from "@/app/dashboard/listings/schemas";
import { inputClass, labelClass, errorClass } from "./styles";

const SQFT_PER_MARLA = 272.25;
const MARLA_PER_KANAL = 20;

type Features = NonNullable<Step3Data["features"]>;

const FEATURE_LABELS: { key: keyof Features; label: string }[] = [
  { key: "electricity", label: "Electricity" },
  { key: "gas", label: "Gas" },
  { key: "water", label: "Water" },
  { key: "security", label: "Security Guard" },
  { key: "backup_generator", label: "Backup Generator" },
  { key: "swimming_pool", label: "Swimming Pool" },
  { key: "gym", label: "Gym" },
  { key: "mosque", label: "Mosque" },
  { key: "park", label: "Park Nearby" },
  { key: "cctv", label: "CCTV" },
  { key: "internet", label: "Internet" },
  { key: "servant_quarters", label: "Servant Quarters" },
];

const FURNISHED_OPTIONS: { value: NonNullable<Step3Data["furnished_status"]>; label: string }[] = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-Furnished" },
  { value: "furnished", label: "Furnished" },
];

const FLOOR_TYPES: Step1Data["type"][] = ["flat", "upper_portion", "lower_portion"];

const PRICE_LABELS: Record<NonNullable<Step1Data["rental_period"]>, string> = {
  monthly: "Monthly Rent",
  weekly: "Weekly Rate",
  daily: "Daily Rate",
};

function formatWithCommas(value: number): string {
  return value.toLocaleString("en-US");
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function Step3Details({
  data,
  errors,
  propertyType,
  purpose,
  rentalPeriod,
  onChange,
}: {
  data: Partial<Step3Data>;
  errors: Record<string, string>;
  propertyType?: Step1Data["type"];
  purpose?: Step1Data["purpose"];
  rentalPeriod?: Step1Data["rental_period"];
  onChange: (data: Partial<Step3Data>) => void;
}) {
  const showFloorFields = propertyType != null && FLOOR_TYPES.includes(propertyType);
  const priceLabel = purpose === "rent" ? PRICE_LABELS[rentalPeriod ?? "monthly"] : "Price";
  const kanal = data.area_marla != null ? round2(data.area_marla / MARLA_PER_KANAL) : null;

  function handlePriceChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    onChange({ price: digits ? Number(digits) : (undefined as unknown as number) });
  }

  function handleSqftChange(raw: string) {
    if (raw === "") {
      onChange({ area_sqft: null });
      return;
    }
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    onChange({ area_sqft: value, area_marla: round2(value / SQFT_PER_MARLA) });
  }

  function handleMarlaChange(raw: string) {
    if (raw === "") {
      onChange({ area_marla: null });
      return;
    }
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    onChange({ area_marla: value, area_sqft: round2(value * SQFT_PER_MARLA) });
  }

  function toggleFeature(key: keyof Features) {
    const current: Features = {
      electricity: false,
      gas: false,
      water: false,
      security: false,
      backup_generator: false,
      swimming_pool: false,
      gym: false,
      mosque: false,
      park: false,
      cctv: false,
      internet: false,
      servant_quarters: false,
      ...data.features,
    };
    onChange({ features: { ...current, [key]: !current[key] } });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className={labelClass}>{priceLabel}</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-mid">PKR</span>
          <input
            value={data.price != null ? formatWithCommas(data.price) : ""}
            onChange={(event) => handlePriceChange(event.target.value)}
            placeholder={purpose === "rent" && rentalPeriod !== "monthly" ? "5,000" : "4,500,000"}
            inputMode="numeric"
            className={inputClass}
          />
        </div>
        {errors.price && <p className={errorClass}>⚠ {errors.price}</p>}

        <label className="mt-2 flex items-center gap-2 text-sm text-black">
          <input
            type="checkbox"
            checked={data.is_negotiable ?? false}
            onChange={(event) => onChange({ is_negotiable: event.target.checked })}
            className="accent-secondary"
          />
          Price is negotiable
        </label>
      </div>

      <div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Area (sqft)</label>
            <input
              type="number"
              value={data.area_sqft ?? ""}
              onChange={(event) => handleSqftChange(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Area (Marla)</label>
            <input
              type="number"
              value={data.area_marla ?? ""}
              onChange={(event) => handleMarlaChange(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Area (Kanal)</label>
            <input type="number" value={kanal ?? ""} readOnly className={`${inputClass} opacity-70`} />
          </div>
        </div>
        <p className="mt-1 text-xs text-primary-mid">1 Marla = 272.25 sqft · 1 Kanal = 20 Marla</p>
      </div>

      <div>
        <h3 className="text-base font-bold text-black">Rooms</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <NumberStepper label="Beds" value={data.beds ?? 0} onChange={(value) => onChange({ beds: value })} />
          <NumberStepper label="Baths" value={data.baths ?? 0} onChange={(value) => onChange({ baths: value })} />
          <NumberStepper
            label="Parking Spaces"
            value={data.parking_spaces ?? 0}
            onChange={(value) => onChange({ parking_spaces: value })}
          />
          <div>
            <label className={labelClass}>Property Age</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.age_years ?? ""}
                onChange={(event) =>
                  onChange({ age_years: event.target.value === "" ? null : Number(event.target.value) })
                }
                className={inputClass}
              />
              <span className="text-sm text-primary-mid">years</span>
            </div>
          </div>
        </div>
      </div>

      {showFloorFields && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Floor Number</label>
            <input
              type="number"
              value={data.floor_number ?? ""}
              onChange={(event) =>
                onChange({ floor_number: event.target.value === "" ? null : Number(event.target.value) })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Total Floors</label>
            <input
              type="number"
              value={data.floors ?? ""}
              onChange={(event) =>
                onChange({ floors: event.target.value === "" ? null : Number(event.target.value) })
              }
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-base font-bold text-black">Furnished Status</h3>
        <div className="mt-3 flex gap-3">
          {FURNISHED_OPTIONS.map((option) => {
            const selected = (data.furnished_status ?? "unfurnished") === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ furnished_status: option.value })}
                style={selected ? { backgroundColor: "rgba(180,231,23,0.08)" } : undefined}
                className={`flex-1 rounded-xl border-2 p-4 text-center text-sm font-semibold text-black transition ${
                  selected ? "border-secondary" : "border-primary"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-black">Features &amp; Amenities</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {FEATURE_LABELS.map((feature) => (
            <label key={feature.key} className="flex items-center gap-2 text-sm text-black">
              <input
                type="checkbox"
                checked={data.features?.[feature.key] ?? false}
                onChange={() => toggleFeature(feature.key)}
                className="accent-secondary"
              />
              {feature.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="rounded-lg bg-primary px-3 py-2 text-white"
        >
          −
        </button>
        <span className="w-8 text-center text-sm text-black">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="rounded-lg bg-primary px-3 py-2 text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}
