"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface FilterTypeOption {
  value: string;
  label: string;
}

export interface FilterAreaOption {
  slug: string;
  name: string;
}

const BED_BATH_OPTIONS = ["Any", "1", "2", "3", "4", "5+"];
const FLOOR_OPTIONS: { label: string; value: string }[] = [
  { label: "Any", value: "" },
  { label: "Single Story", value: "1" },
  { label: "Double Story", value: "2" },
  { label: "Triple+ Story", value: "3" },
];
// Standard plot/house sizes actually used in Pakistan real estate — not an
// arbitrary slider, since buyers search in these fixed increments (a "7
// Marla" search is common; a "6.3 Marla" one basically never happens).
const MARLA_OPTIONS = ["3", "5", "7", "8", "10", "12", "14", "20"];

const RENTAL_PERIOD_OPTIONS: { label: string; value: "monthly" | "weekly" | "daily" }[] = [
  { label: "Long Term (Monthly)", value: "monthly" },
  { label: "Short Term (Weekly)", value: "weekly" },
  { label: "Short Term (Daily)", value: "daily" },
];

export function FilterSidebar({
  citySlug,
  purpose,
  areaSlug,
  societySlug,
  typeOptions,
  areaList,
  societyList,
  typeCounts,
  basePath,
}: {
  citySlug: string;
  purpose: "buy" | "rent";
  areaSlug?: string;
  societySlug?: string;
  typeOptions: FilterTypeOption[];
  areaList: FilterAreaOption[];
  societyList?: FilterAreaOption[];
  typeCounts: Record<string, number>;
  // Lets non-purpose-routed sections (e.g. /commercial/[city], which spans
  // types rather than a single buy/rent purpose split) reuse this sidebar
  // without its area-select and "clear filters" navigation falling back to
  // the wrong /${purpose}/... route. Buy/rent pages omit this and keep the
  // exact behavior they had before.
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentType = searchParams.get("type") ?? "";
  const currentBeds = searchParams.get("beds") ?? "";
  const currentBaths = searchParams.get("baths") ?? "";
  const currentFloors = searchParams.get("floors") ?? "";
  const currentMinArea = searchParams.get("min_area_marla") ?? "";
  const currentMaxArea = searchParams.get("max_area_marla") ?? "";
  const currentRentalPeriod = searchParams.get("rental_period") ?? "";
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");

  const activeCount = [
    "type",
    "min_price",
    "max_price",
    "beds",
    "baths",
    "floors",
    "min_area_marla",
    "max_area_marla",
    ...(purpose === "rent" ? ["rental_period"] : []),
  ].filter((key) => searchParams.get(key)).length;

  function updateParams(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function handleTypeToggle(value: string) {
    updateParams({ type: currentType === value ? undefined : value });
  }

  function handleRentalPeriodSelect(value: string) {
    updateParams({ rental_period: currentRentalPeriod === value ? undefined : value });
  }

  function handleBedsSelect(option: string) {
    updateParams({ beds: option === "Any" ? undefined : option.replace("+", "") });
  }

  function handleBathsSelect(option: string) {
    updateParams({ baths: option === "Any" ? undefined : option.replace("+", "") });
  }

  function handleFloorsSelect(value: string) {
    updateParams({ floors: currentFloors === value ? undefined : value || undefined });
  }

  function handleApplyPrice() {
    updateParams({ min_price: minPrice || undefined, max_price: maxPrice || undefined });
  }

  function handleMarlaSelect(size: string) {
    // Exact size is expressed as a tight range (matches the "5 Marla"
    // popular-search links) rather than an equality filter, since a real
    // 5 Marla plot can list as 4.9 or 5.1 depending on how it was surveyed.
    const isActive = currentMinArea === String(Number(size) - 0.5) && currentMaxArea === String(Number(size) + 0.5);
    if (isActive) {
      updateParams({ min_area_marla: undefined, max_area_marla: undefined });
      return;
    }
    updateParams({
      min_area_marla: String(Number(size) - 0.5),
      max_area_marla: String(Number(size) + 0.5),
    });
  }

  const resolvedBasePath = basePath ?? `/${purpose}`;

  function handleAreaChange(slug: string) {
    if (!slug) return;
    router.push(`${resolvedBasePath}/${citySlug}/${slug}/`);
  }

  function handleSocietyChange(slug: string) {
    if (!slug || !areaSlug) return;
    router.push(`${resolvedBasePath}/${citySlug}/${areaSlug}/${slug}/`);
  }

  const content = (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-black">Property Type</p>
        <div className="space-y-1.5">
          {typeOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-black">
              <input
                type="checkbox"
                checked={currentType === option.value}
                onChange={() => handleTypeToggle(option.value)}
                className="accent-secondary"
              />
              {option.label}
              {typeCounts[option.value] ? (
                <span className="text-xs text-primary-mid">({typeCounts[option.value]})</span>
              ) : null}
            </label>
          ))}
        </div>
      </div>

      {purpose === "rent" && (
        <div>
          <p className="mb-2 text-sm font-semibold text-black">Rental Term</p>
          <div className="space-y-1.5">
            {RENTAL_PERIOD_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-black">
                <input
                  type="checkbox"
                  checked={currentRentalPeriod === option.value}
                  onChange={() => handleRentalPeriodSelect(option.value)}
                  className="accent-secondary"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-black">Price Range</p>
        <div className="flex gap-2">
          <input
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Min PKR"
            inputMode="numeric"
            className="w-full rounded-lg border border-primary px-2 py-1.5 text-sm text-black"
          />
          <input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Max PKR"
            inputMode="numeric"
            className="w-full rounded-lg border border-primary px-2 py-1.5 text-sm text-black"
          />
        </div>
        <button
          type="button"
          onClick={handleApplyPrice}
          className="mt-2 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-primary"
        >
          Apply
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-black">Area (Marla)</p>
        <div className="flex flex-wrap gap-1.5">
          {MARLA_OPTIONS.map((size) => {
            const selected =
              currentMinArea === String(Number(size) - 0.5) && currentMaxArea === String(Number(size) + 0.5);
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleMarlaSelect(size)}
                className={`rounded-lg px-2.5 py-1.5 text-xs ${
                  selected ? "bg-primary text-white" : "border border-primary bg-white text-black"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-black">Bedrooms</p>
        <div className="flex flex-wrap gap-1.5">
          {BED_BATH_OPTIONS.map((option) => {
            const value = option === "Any" ? "" : option.replace("+", "");
            const selected = currentBeds === value;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleBedsSelect(option)}
                className={`h-8 w-10 rounded-lg text-center text-sm ${
                  selected ? "bg-primary text-white" : "border border-primary bg-white text-black"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-black">Bathrooms</p>
        <div className="flex flex-wrap gap-1.5">
          {BED_BATH_OPTIONS.map((option) => {
            const value = option === "Any" ? "" : option.replace("+", "");
            const selected = currentBaths === value;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleBathsSelect(option)}
                className={`h-8 w-10 rounded-lg text-center text-sm ${
                  selected ? "bg-primary text-white" : "border border-primary bg-white text-black"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-black">Floors</p>
        <div className="flex flex-wrap gap-1.5">
          {FLOOR_OPTIONS.map((option) => {
            const selected = currentFloors === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => handleFloorsSelect(option.value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs ${
                  selected ? "bg-primary text-white" : "border border-primary bg-white text-black"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {!areaSlug && areaList.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-black">Area</p>
          <label className="sr-only" htmlFor="area-filter">
            Select area
          </label>
          <select
            id="area-filter"
            defaultValue=""
            onChange={(event) => handleAreaChange(event.target.value)}
            className="w-full rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
          >
            <option value="">Select area</option>
            {areaList.map((areaOption) => (
              <option key={areaOption.slug} value={areaOption.slug}>
                {areaOption.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {areaSlug && !societySlug && societyList && societyList.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-black">Society</p>
          <label className="sr-only" htmlFor="society-filter">
            Select society
          </label>
          <select
            id="society-filter"
            defaultValue=""
            onChange={(event) => handleSocietyChange(event.target.value)}
            className="w-full rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
          >
            <option value="">Select society</option>
            {societyList.map((societyOption) => (
              <option key={societyOption.slug} value={societyOption.slug}>
                {societyOption.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push(`${resolvedBasePath}/${citySlug}/`)}
        className="cursor-pointer text-xs text-primary underline"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="mb-4 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary md:hidden"
      >
        ⚙ Filter ({activeCount})
      </button>

      <div className="hidden w-64 shrink-0 rounded-xl border border-primary bg-white p-5 md:block">{content}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] translate-y-0 overflow-y-auto rounded-t-2xl border-t border-primary bg-white p-5 transition-transform">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-bold text-black">Filters</p>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-sm text-primary">
                Done
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
