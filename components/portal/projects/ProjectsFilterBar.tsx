"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PROPERTY_TYPES = [
  { value: "", label: "All Types" },
  { value: "flats", label: "Flats" },
  { value: "plots", label: "Plots" },
  { value: "houses", label: "Houses" },
  { value: "shops", label: "Shops" },
  { value: "offices", label: "Offices" },
];

const STATUSES = [
  { value: "", label: "All Status" },
  { value: "pre_launch", label: "Pre-launch" },
  { value: "launching", label: "Launching" },
  { value: "under_construction", label: "Under Construction" },
  { value: "ready", label: "Ready" },
];

export function ProjectsFilterBar({
  cities,
  hideCityFilter = false,
}: {
  cities: { id: string; name: string; slug: string }[];
  hideCityFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-primary bg-white px-6 py-3">
      {!hideCityFilter && (
        <select
          value={searchParams.get("city") ?? ""}
          onChange={(event) => updateParam("city", event.target.value)}
          className="rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
          aria-label="Filter by city"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={searchParams.get("property_type") ?? ""}
        onChange={(event) => updateParam("property_type", event.target.value)}
        className="rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
        aria-label="Filter by property type"
      >
        {PROPERTY_TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(event) => updateParam("status", event.target.value)}
        className="rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
        aria-label="Filter by status"
      >
        {STATUSES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
