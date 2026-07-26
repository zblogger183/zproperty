"use client";

import { useRouter } from "next/navigation";

export function CityFilterSelect({
  cities,
  currentCityId,
}: {
  cities: { id: string; name: string }[];
  currentCityId?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={currentCityId ?? ""}
      onChange={(event) => {
        const params = new URLSearchParams(window.location.search);
        if (event.target.value) {
          params.set("city", event.target.value);
        } else {
          params.delete("city");
        }
        params.delete("page");
        router.push(`/admin/listings?${params.toString()}`);
      }}
      className="w-40 rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
    >
      <option value="">All cities</option>
      {cities.map((city) => (
        <option key={city.id} value={city.id}>
          {city.name}
        </option>
      ))}
    </select>
  );
}
