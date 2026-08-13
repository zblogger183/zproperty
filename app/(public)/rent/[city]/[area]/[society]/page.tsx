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
  return buildSearchMetadata({ purpose: "rent", citySlug: city, areaSlug: area, societySlug: society, searchParams: sp });
}

export default async function SocietyListingsRentPage({ params, searchParams }: PageParams) {
  const { city, area, society } = await params;
  const sp = await searchParams;
  return (
    <SearchResultsPage purpose="rent" citySlug={city} areaSlug={area} societySlug={society} searchParams={sp} />
  );
}
