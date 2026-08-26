"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { parsePropertyId } from "@/lib/utils/formatPropertyId";

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
  const [propertyIdError, setPropertyIdError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPropertyIdError(null);

    const trimmed = query.trim();
    const propertyId = parsePropertyId(trimmed);

    // A Property ID identifies one specific listing regardless of city, so
    // this bypasses the city dropdown entirely and jumps straight to it —
    // the same "paste an ID, land on the property" flow zameen.com offers.
    if (propertyId != null) {
      setIsLookingUp(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("listings")
        .select("slug")
        .eq("listing_number", propertyId)
        .eq("status", "active")
        .maybeSingle();
      setIsLookingUp(false);

      if (data?.slug) {
        router.push(`/listing/${data.slug}`);
      } else {
        setPropertyIdError(`No listing found with ID ${trimmed.toUpperCase()}.`);
      }
      return;
    }

    if (!city) return;

    const params = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";

    if (tab === "buy") {
      router.push(`/buy/${city}${params}`);
    } else if (tab === "rent") {
      router.push(`/rent/${city}${params}`);
    } else {
      router.push(`/new-projects/city/${city}${params}`);
    }
  }

  return (
    <section className="relative overflow-hidden bg-primary px-4 pb-20 pt-16">
      {/* bg-primary above is the fallback shown before this loads (or if
          public/images/hero-bg.webp is ever missing) — eager + high
          fetchPriority since this is the homepage's LCP element. Next 16
          deprecated `priority` in favor of `preload`, but its own docs say
          not to combine preload with fetchPriority — use fetchPriority
          directly instead (see node_modules/next/dist/docs/.../image.md). */}
      <Image
        src="/images/hero-bg.webp"
        alt=""
        fill
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        quality={65}
        className="object-cover"
      />
      {/* Dark scrim so the white heading/text stays readable regardless of
          the photo's own colors — matches the photographic-hero-with-dark-
          overlay pattern zameen.com uses. */}
      <div className="absolute inset-0 bg-primary/70" />

      <div className="relative mx-auto max-w-3xl text-center">
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
            <label htmlFor="hero-city" className="sr-only">
              City
            </label>
            <select
              id="hero-city"
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
              placeholder="Search by area, society, project or Property ID..."
              className="w-full flex-1 rounded-lg border-[1.5px] border-primary px-3 py-2.5 text-sm text-black placeholder:text-primary-mid"
            />

            <button
              type="submit"
              disabled={isLookingUp}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-60"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              {isLookingUp ? "Searching..." : "Search"}
            </button>
          </form>
          {propertyIdError && <p className="mt-2 text-left text-xs font-medium text-secondary">{propertyIdError}</p>}
        </div>
      </div>
    </section>
  );
}
