import type { Metadata } from "next";
import { buildSearchMetadata } from "@/lib/search/fetchSearchResults";
import { SearchResultsPage } from "@/components/portal/search/SearchResultsPage";

// Filters live in URL search params and change per request — ISR would
// serve stale/wrong results for every filter combination, so this route is
// SSR (force-dynamic) rather than the ISR used by the rest of the public site.
export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ city: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: PageParams): Promise<Metadata> {
  const { city } = await params;
  const sp = await searchParams;
  return buildSearchMetadata({ purpose: "buy", citySlug: city, searchParams: sp, allPurposes: true });
}

// /buy/[city] is the site's general "properties in this city" page — it
// shows every active listing (buy and rent alike), with each ListingCard's
// own Buy/Rent badge giving the per-listing distinction. /rent/[city]
// remains the dedicated rent-only view.
export default async function CityListingsBuyPage({ params, searchParams }: PageParams) {
  const { city } = await params;
  const sp = await searchParams;
  return <SearchResultsPage purpose="buy" citySlug={city} searchParams={sp} allPurposes />;
}
