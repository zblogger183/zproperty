import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface CitySummary {
  id: string;
  name: string;
  slug: string;
  listing_count: number;
  rent_count: number;
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
              <div
                key={city.id}
                className="group flex flex-col gap-2 rounded-xl border border-primary p-6 transition hover:border-2 hover:border-secondary"
              >
                <Link href={`/buy/${city.slug}`} className="flex flex-col gap-2">
                  <span className="text-lg font-bold text-black">{city.name}</span>
                  <span className="text-sm text-primary-mid">
                    {city.listing_count.toLocaleString()} Properties
                  </span>
                </Link>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/rent/${city.slug}`}
                    className="text-xs text-primary-mid hover:text-primary hover:underline"
                  >
                    {city.rent_count.toLocaleString()} for rent
                  </Link>
                  <ArrowRight
                    className="h-5 w-5 text-primary transition group-hover:text-secondary"
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
