import type { Metadata } from "next";
import { buildSearchMetadata } from "@/lib/search/fetchSearchResults";
import { SearchResultsPage } from "@/components/portal/search/SearchResultsPage";

const COMMERCIAL_TYPES = ["office", "shop", "commercial_plot", "warehouse", "building"];

export const dynamic = "force-dynamic";

type PageParams = {
  params: Promise<{ city: string; area: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageParams): Promise<Metadata> {
  const { city, area } = await params;
  const sp = await searchParams;
  return buildSearchMetadata({
    purpose: "buy",
    citySlug: city,
    areaSlug: area,
    searchParams: sp,
    baseTypes: COMMERCIAL_TYPES,
    basePath: "/commercial",
  });
}

export default async function AreaListingsCommercialPage({ params, searchParams }: PageParams) {
  const { city, area } = await params;
  const sp = await searchParams;
  return (
    <SearchResultsPage
      purpose="buy"
      citySlug={city}
      areaSlug={area}
      searchParams={sp}
      baseTypes={COMMERCIAL_TYPES}
      basePath="/commercial"
      typeLabelOverride="Commercial Property"
    />
  );
}
