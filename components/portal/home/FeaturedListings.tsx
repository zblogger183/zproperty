import Link from "next/link";
import type { ListingCardData } from "@/types";
import { ListingCard } from "../ListingCard";

export function FeaturedListings({
  listings,
  title = "Featured Properties for Sale",
  viewAllHref = "/buy/lahore",
  emptyMessage = "Featured properties will appear here once listings go live.",
}: {
  listings: ListingCardData[];
  title?: string;
  viewAllHref?: string;
  emptyMessage?: string;
}) {
  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-black">{title}</h2>
          <Link href={viewAllHref} className="text-sm text-primary transition hover:text-primary-mid">
            View all →
          </Link>
        </div>

        {listings.length === 0 ? (
          <p className="mt-8 text-sm text-primary-mid">{emptyMessage}</p>
        ) : (
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
            {listings.map((listing) => (
              <div key={listing.id} className="w-64 shrink-0 sm:w-auto">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
