import type { Metadata } from "next";
import { buildSearchMetadata } from "@/lib/search/fetchSearchResults";
import { SearchResultsPage } from "@/components/portal/search/SearchResultsPage";

const PLOT_TYPES = ["residential_plot", "commercial_plot", "agricultural_land"];

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
    baseTypes: PLOT_TYPES,
    basePath: "/plots",
    typeLabelOverride: "Plot",
  });
}

export default async function AreaListingsPlotsPage({ params, searchParams }: PageParams) {
  const { city, area } = await params;
  const sp = await searchParams;
  return (
    <SearchResultsPage
      purpose="buy"
      citySlug={city}
      areaSlug={area}
      searchParams={sp}
      baseTypes={PLOT_TYPES}
      basePath="/plots"
      typeLabelOverride="Plot"
    />
  );
}
