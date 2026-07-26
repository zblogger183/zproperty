"use client";

export interface SearchFiltersValue {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}

export function SearchFilters({
  value,
  onChange,
}: {
  value: SearchFiltersValue;
  onChange: (value: SearchFiltersValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-secondary p-4">
      <label className="flex flex-col gap-1 text-sm text-text">
        Min price
        <input
          type="number"
          value={value.minPrice ?? ""}
          onChange={(event) =>
            onChange({ ...value, minPrice: Number(event.target.value) || undefined })
          }
          className="rounded-md border border-secondary bg-bg px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        Max price
        <input
          type="number"
          value={value.maxPrice ?? ""}
          onChange={(event) =>
            onChange({ ...value, maxPrice: Number(event.target.value) || undefined })
          }
          className="rounded-md border border-secondary bg-bg px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        Bedrooms
        <input
          type="number"
          value={value.bedrooms ?? ""}
          onChange={(event) =>
            onChange({ ...value, bedrooms: Number(event.target.value) || undefined })
          }
          className="rounded-md border border-secondary bg-bg px-2 py-1"
        />
      </label>
    </div>
  );
}
