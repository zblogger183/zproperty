"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Tab = "buy" | "rent" | "new-projects";

const TABS: { key: Tab; label: string }[] = [
  { key: "buy", label: "Buy" },
  { key: "rent", label: "Rent" },
  { key: "new-projects", label: "New Projects" },
];

export interface HeroCity {
  id: string;
  name: string;
  slug: string;
}

export interface HeroStats {
  listings: number;
  agents: number;
  cities: number;
}

export function HeroSection({ cities, stats }: { cities: HeroCity[]; stats: HeroStats }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("buy");
  const [city, setCity] = useState(cities[0]?.slug ?? "");
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!city) return;

    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";

    if (tab === "buy") {
      router.push(`/buy/${city}${params}`);
    } else if (tab === "rent") {
      router.push(`/rent/${city}${params}`);
    } else {
      router.push(`/new-projects/city/${city}${params}`);
    }
  }

  return (
    <section className="bg-primary px-4 pb-20 pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-white md:text-5xl">Find Your Property in Pakistan</h1>
        <p className="mt-3 text-lg text-white/70">Verified listings. Trusted agents.</p>
        <p className="mt-4 text-sm font-semibold text-secondary">
          {stats.listings.toLocaleString()} {stats.listings === 1 ? "Listing" : "Listings"} ·{" "}
          {stats.agents.toLocaleString()} {stats.agents === 1 ? "Agent" : "Agents"} ·{" "}
          {stats.cities.toLocaleString()} {stats.cities === 1 ? "City" : "Cities"}
        </p>

        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-primary bg-white p-4">
          <div className="flex gap-2">
            {TABS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTab(option.key)}
                className={`rounded-lg px-4 py-2 text-sm ${
                  tab === option.key
                    ? "bg-primary font-bold text-white"
                    : "border border-primary bg-white text-black"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full shrink-0 rounded-lg border-[1.5px] border-primary bg-white px-3 py-2.5 text-sm text-black sm:w-36"
            >
              {cities.length === 0 && <option value="">No cities yet</option>}
              {cities.map((option) => (
                <option key={option.id} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by area, society or project..."
              className="w-full flex-1 rounded-lg border-[1.5px] border-primary px-3 py-2.5 text-sm text-black placeholder:text-primary-mid"
            />

            <button
              type="submit"
              disabled={!city}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-60"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
