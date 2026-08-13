import type { Metadata } from "next";
import { buildSearchMetadata } from "@/lib/search/fetchSearchResults";
import { SearchResultsPage } from "@/components/portal/search/SearchResultsPage";

// Commercial spans several listing types (not a single buy/rent purpose
// split like /buy and /rent) — see fetchSearchResults' baseTypes doc.
// Purpose is fixed to "buy" here to match the existing "Commercial for
// Sale" footer link; a for-rent commercial section would need its own
// route the same way /rent mirrors /buy.
const COMMERCIAL_TYPES = ["office", "shop", "commercial_plot", "warehouse", "building"];

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ city: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: PageParams): Promise<Metadata> {
  const { city } = await params;
  const sp = await searchParams;
  return buildSearchMetadata({
    purpose: "buy",
    citySlug: city,
    searchParams: sp,
    baseTypes: COMMERCIAL_TYPES,
    basePath: "/commercial",
    typeLabelOverride: "Commercial Property",
  });
}

export default async function CityListingsCommercialPage({ params, searchParams }: PageParams) {
  const { city } = await params;
  const sp = await searchParams;
  return (
    <SearchResultsPage
      purpose="buy"
      citySlug={city}
      searchParams={sp}
      baseTypes={COMMERCIAL_TYPES}
      basePath="/commercial"
      typeLabelOverride="Commercial Property"
    />
  );
}
