"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AGENT_SPECIALTIES } from "@/lib/constants/agentSpecialties";

const DIRECTORY_SPECIALTIES = AGENT_SPECIALTIES.slice(0, 6);

export function AgentsFilterBar({ cities }: { cities: { id: string; name: string; slug: string }[] }) {
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
    <div className="flex flex-wrap items-center gap-3 border-b border-primary bg-white px-6 py-4">
      <select
        value={searchParams.get("city") ?? ""}
        onChange={(event) => updateParam("city", event.target.value)}
        className="w-40 rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
        aria-label="Filter by city"
      >
        <option value="">All Cities</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("specialty") ?? ""}
        onChange={(event) => updateParam("specialty", event.target.value)}
        className="w-44 rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
        aria-label="Filter by specialty"
      >
        <option value="">All Specialties</option>
        {DIRECTORY_SPECIALTIES.map((specialty) => (
          <option key={specialty.value} value={specialty.value}>
            {specialty.label}
          </option>
        ))}
      </select>
    </div>
  );
}
