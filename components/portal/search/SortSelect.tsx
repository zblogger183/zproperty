"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  return (
    <select
      value={current}
      onChange={(event) => {
        const next = new URLSearchParams(searchParams.toString());
        if (event.target.value === "newest") next.delete("sort");
        else next.set("sort", event.target.value);
        next.delete("page");
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
      aria-label="Sort results"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
