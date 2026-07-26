import type { Metadata } from "next";
import { backfillAgentContacts, createPublicClient } from "@/lib/supabase/public";
import { searchMeta } from "@/lib/seo/metadata";
import type { ListingCardData } from "@/types";

const PAGE_SIZE = 20;

export type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

export interface SearchFilters {
  type?: string;
  min_price?: number;
  max_price?: number;
  beds?: number;
  baths?: number;
  sort: SortOption;
  page: number;
  q?: string;
}

export interface CitySummary {
  id: string;
  name: string;
  slug: string;
}

export interface AreaSummary {
  id: string;
  name: string;
  slug: string;
}

export interface SearchResults {
  city: CitySummary;
  area: AreaSummary | null;
  filters: SearchFilters;
  listings: ListingCardData[];
  total: number;
  totalPages: number;
  areaList: AreaSummary[];
  typeCounts: Record<string, number>;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function param(sp: RawSearchParams, key: string): string | undefined {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseSearchFilters(sp: RawSearchParams): SearchFilters {
  const sortRaw = param(sp, "sort");
  const sort: SortOption =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "popular" ? sortRaw : "newest";

  const minPrice = param(sp, "min_price");
  const maxPrice = param(sp, "max_price");
  const beds = param(sp, "beds");
  const baths = param(sp, "baths");
  const page = Math.max(1, Number(param(sp, "page")) || 1);

  return {
    type: param(sp, "type") || undefined,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    beds: beds ? Number(beds) : undefined,
    baths: baths ? Number(baths) : undefined,
    sort,
    page,
    q: param(sp, "q") || undefined,
  };
}

const LISTING_SELECT = `id, slug, title, purpose, type, price, area_marla, beds, baths, primary_image_url,
       is_featured, is_hot_deal, agent_id, created_at,
       city:cities(name,slug), area:areas(name,slug), agent:public_agent_contact(name, whatsapp, profile_slug)`;

/**
 * Shared data fetch behind all four buy/rent × city/area search-results
 * routes. Returns null when the city (or area, if given) doesn't exist —
 * callers should notFound() in that case.
 */
export async function fetchSearchResults(params: {
  purpose: "buy" | "rent";
  citySlug: string;
  areaSlug?: string;
  searchParams: RawSearchParams;
}): Promise<SearchResults | null> {
  const supabase = createPublicClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id, name, slug")
    .eq("slug", params.citySlug)
    .maybeSingle();

  if (!city) return null;

  let area: AreaSummary | null = null;
  if (params.areaSlug) {
    const { data: areaRow } = await supabase
      .from("areas")
      .select("id, name, slug")
      .eq("slug", params.areaSlug)
      .eq("city_id", city.id)
      .maybeSingle();

    if (!areaRow) return null;
    area = areaRow;
  }

  const filters = parseSearchFilters(params.searchParams);

  let listingsQuery = supabase
    .from("listings")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("status", "active")
    .eq("city_id", city.id)
    .eq("purpose", params.purpose);

  if (area) listingsQuery = listingsQuery.eq("area_id", area.id);
  if (filters.type) listingsQuery = listingsQuery.eq("type", filters.type);
  if (filters.min_price != null) listingsQuery = listingsQuery.gte("price", filters.min_price);
  if (filters.max_price != null) listingsQuery = listingsQuery.lte("price", filters.max_price);
  if (filters.beds != null) listingsQuery = listingsQuery.gte("beds", filters.beds);
  if (filters.baths != null) listingsQuery = listingsQuery.gte("baths", filters.baths);
  if (filters.q) {
    listingsQuery = listingsQuery.textSearch("search_vector", filters.q, { type: "websearch", config: "english" });
  }

  switch (filters.sort) {
    case "price_asc":
      listingsQuery = listingsQuery.order("price", { ascending: true });
      break;
    case "price_desc":
      listingsQuery = listingsQuery.order("price", { ascending: false });
      break;
    case "popular":
      listingsQuery = listingsQuery.order("views_count", { ascending: false });
      break;
    default:
      // Featured listings always first for "newest".
      listingsQuery = listingsQuery.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  listingsQuery = listingsQuery.range(from, to);

  const areaListPromise = area
    ? Promise.resolve({ data: [] as AreaSummary[] })
    : supabase.from("areas").select("id, name, slug").eq("city_id", city.id).eq("is_active", true).order("display_order");

  // No GROUP BY support in PostgREST — counted client-side from the type
  // column of every active listing in the current city/purpose(/area)
  // scope. Capped defensively; this is a "how many if I picked this type"
  // sidebar hint, not the paginated result set itself.
  let typeCountQuery = supabase
    .from("listings")
    .select("type")
    .eq("status", "active")
    .eq("city_id", city.id)
    .eq("purpose", params.purpose)
    .limit(5000);
  if (area) typeCountQuery = typeCountQuery.eq("area_id", area.id);

  const [{ data: listingsRaw, count }, { data: areaListRaw }, { data: typeRows }] = await Promise.all([
    listingsQuery,
    areaListPromise,
    typeCountQuery,
  ]);

  const listings = await backfillAgentContacts(supabase, (listingsRaw ?? []) as unknown as ListingCardData[]);

  const typeCounts: Record<string, number> = {};
  for (const row of (typeRows ?? []) as { type: string }[]) {
    typeCounts[row.type] = (typeCounts[row.type] ?? 0) + 1;
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    city,
    area,
    filters,
    listings,
    total,
    totalPages,
    areaList: (areaListRaw ?? []) as AreaSummary[],
    typeCounts,
  };
}

/**
 * Runs the same fetch a second time rather than sharing a cache()-wrapped
 * call with the page body: unlike getListingWithAgent's single string slug
 * (a primitive React's cache() reliably de-dupes on), this takes a params
 * object that generateMetadata and the page component each construct
 * independently — not guaranteed to be the same reference, so cache()
 * wouldn't reliably collapse the two calls anyway. These routes are already
 * force-dynamic SSR (not ISR), so one extra query pair per request is a
 * minor, accepted cost rather than a regression.
 */
export async function buildSearchMetadata(params: {
  purpose: "buy" | "rent";
  citySlug: string;
  areaSlug?: string;
  searchParams: RawSearchParams;
}): Promise<Metadata> {
  const results = await fetchSearchResults(params);

  if (!results) {
    return { title: "Not found | SarZameenz.com" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarzameenz.com";
  const basePath = params.areaSlug
    ? `/${params.purpose}/${params.citySlug}/${params.areaSlug}/`
    : `/${params.purpose}/${params.citySlug}/`;

  return searchMeta({
    purpose: params.purpose,
    type: results.filters.type,
    area_name: results.area?.name,
    city_name: results.city.name,
    count: results.total,
    canonicalUrl: results.filters.page > 1 ? `${siteUrl}${basePath}` : undefined,
  });
}
