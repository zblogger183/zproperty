import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface CitySummary {
  id: string;
  name: string;
  slug: string;
  listing_count: number;
}

export function CitiesSection({ cities }: { cities: CitySummary[] }) {
  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-black">Browse by City</h2>
        <p className="mt-2 text-base text-primary-mid">Find properties in Pakistan&apos;s top cities</p>

        {cities.length === 0 ? (
          <p className="mt-8 text-sm text-primary-mid">Cities will appear here soon.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/buy/${city.slug}`}
                className="group flex flex-col gap-2 rounded-xl border border-primary p-6 transition hover:border-2 hover:border-secondary"
              >
                <span className="text-lg font-bold text-black">{city.name}</span>
                <span className="text-sm text-primary-mid">
                  {city.listing_count.toLocaleString()} properties
                </span>
                <ArrowRight
                  className="h-5 w-5 text-primary transition group-hover:text-secondary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
