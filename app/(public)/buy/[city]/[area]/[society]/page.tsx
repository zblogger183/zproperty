import type { Metadata } from "next";
import { buildSearchMetadata } from "@/lib/search/fetchSearchResults";
import { SearchResultsPage } from "@/components/portal/search/SearchResultsPage";

export const dynamic = "force-dynamic";

type PageParams = {
  params: Promise<{ city: string; area: string; society: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageParams): Promise<Metadata> {
  const { city, area, society } = await params;
  const sp = await searchParams;
  return buildSearchMetadata({
    purpose: "buy",
    citySlug: city,
    areaSlug: area,
    societySlug: society,
    searchParams: sp,
    allPurposes: true,
  });
}

// See CityListingsBuyPage's comment — same "all purposes" behavior applies
// one level down, scoped to this society.
export default async function SocietyListingsBuyPage({ params, searchParams }: PageParams) {
  const { city, area, society } = await params;
  const sp = await searchParams;
  return (
    <SearchResultsPage
      purpose="buy"
      citySlug={city}
      areaSlug={area}
      societySlug={society}
      searchParams={sp}
      allPurposes
    />
  );
}
