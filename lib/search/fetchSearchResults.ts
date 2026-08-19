import type { Metadata } from "next";
import { backfillAgentContacts, createPublicClient } from "@/lib/supabase/public";
import { searchMeta } from "@/lib/seo/metadata";
import { parsePropertyId } from "@/lib/utils/formatPropertyId";
import type { ListingCardData } from "@/types";

const PAGE_SIZE = 20;

export type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

export interface SearchFilters {
  type?: string;
  min_price?: number;
  max_price?: number;
  min_area_marla?: number;
  max_area_marla?: number;
  // 1 = single story, 2 = double story, 3 = "3+" (matched as >=3 — see the
  // .gte() below) — the three buckets buyers actually search for in
  // Pakistan ("single story house", "double story house"), not a literal
  // floor-count picker.
  floors?: number;
  beds?: number;
  baths?: number;
  sort: SortOption;
  page: number;
  q?: string;
  // Slug, not id — resolved against the current society below. Only
  // meaningful once a society is resolved; ignored otherwise.
  phase?: string;
  // Only meaningful on /rent searches — short-term (weekly/daily) vs
  // long-term (monthly) rentals. Ignored on /buy since every "buy" listing
  // defaults to rental_period='monthly' regardless (the column is unused
  // there), so filtering on it would just be a no-op, not wrong — omitted
  // from the query below anyway to keep buy-side query plans unaffected.
  rental_period?: "monthly" | "weekly" | "daily";
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

export interface SocietySummary {
  id: string;
  name: string;
  slug: string;
}

export interface PhaseSummary {
  id: string;
  name: string;
  slug: string;
}

export interface SearchResults {
  city: CitySummary;
  area: AreaSummary | null;
  society: SocietySummary | null;
  phase: PhaseSummary | null;
  filters: SearchFilters;
  listings: ListingCardData[];
  total: number;
  totalPages: number;
  areaList: AreaSummary[];
  societyList: SocietySummary[];
  phaseList: PhaseSummary[];
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
  const minArea = param(sp, "min_area_marla");
  const maxArea = param(sp, "max_area_marla");
  const floors = param(sp, "floors");
  const beds = param(sp, "beds");
  const baths = param(sp, "baths");
  const page = Math.max(1, Number(param(sp, "page")) || 1);
  const rentalPeriodRaw = param(sp, "rental_period");
  const rentalPeriod =
    rentalPeriodRaw === "monthly" || rentalPeriodRaw === "weekly" || rentalPeriodRaw === "daily"
      ? rentalPeriodRaw
      : undefined;

  return {
    type: param(sp, "type") || undefined,
    rental_period: rentalPeriod,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    min_area_marla: minArea ? Number(minArea) : undefined,
    max_area_marla: maxArea ? Number(maxArea) : undefined,
    floors: floors ? Number(floors) : undefined,
    beds: beds ? Number(beds) : undefined,
    baths: baths ? Number(baths) : undefined,
    sort,
    page,
    q: param(sp, "q") || undefined,
    phase: param(sp, "phase") || undefined,
  };
}

const LISTING_SELECT = `id, slug, title, purpose, rental_period, type, price, area_marla, beds, baths, floors, primary_image_url,
       is_featured, is_hot_deal, agent_id, created_at,
       city:cities(name,slug), area:areas(name,slug), agent:public_agent_contact(name, whatsapp, profile_slug)`;

/**
 * Shared data fetch behind all buy/rent/plots/commercial × city/area/society
 * search-results routes. Returns null when the city (or area/society, if
 * given) doesn't exist — callers should notFound() in that case.
 */
export async function fetchSearchResults(params: {
  purpose: "buy" | "rent";
  citySlug: string;
  areaSlug?: string;
  societySlug?: string;
  searchParams: RawSearchParams;
  // Hard scope applied in addition to (not instead of) the user's own
  // `filters.type` narrowing — e.g. /commercial/[city] passes the 5
  // commercial types here so it only ever shows office/shop/plot/warehouse/
  // building listings, while a visitor can still narrow to just "Shop"
  // within that set via the normal type checkboxes.
  baseTypes?: string[];
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

  let society: SocietySummary | null = null;
  if (params.societySlug) {
    if (!area) return null; // societies are always resolved within an area
    const { data: societyRow } = await supabase
      .from("societies")
      .select("id, name, slug")
      .eq("slug", params.societySlug)
      .eq("area_id", area.id)
      .maybeSingle();

    if (!societyRow) return null;
    society = societyRow;
  }

  const filters = parseSearchFilters(params.searchParams);

  let phase: PhaseSummary | null = null;
  if (society && filters.phase) {
    const { data: phaseRow } = await supabase
      .from("society_phases")
      .select("id, name, slug")
      .eq("slug", filters.phase)
      .eq("society_id", society.id)
      .maybeSingle();
    // An unrecognized ?phase= isn't a 404 (unlike city/area/society, it's
    // just a filter) — it just matches nothing, same as any other filter
    // combination with zero results.
    phase = phaseRow ?? null;
  }

  let listingsQuery = supabase
    .from("listings")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("status", "active")
    .eq("city_id", city.id)
    .eq("purpose", params.purpose);

  if (area) listingsQuery = listingsQuery.eq("area_id", area.id);
  if (society) listingsQuery = listingsQuery.eq("society_id", society.id);
  if (phase) listingsQuery = listingsQuery.eq("phase_id", phase.id);
  if (params.baseTypes?.length) listingsQuery = listingsQuery.in("type", params.baseTypes);
  if (filters.type) listingsQuery = listingsQuery.eq("type", filters.type);
  if (params.purpose === "rent" && filters.rental_period) {
    listingsQuery = listingsQuery.eq("rental_period", filters.rental_period);
  }
  if (filters.min_price != null) listingsQuery = listingsQuery.gte("price", filters.min_price);
  if (filters.max_price != null) listingsQuery = listingsQuery.lte("price", filters.max_price);
  if (filters.min_area_marla != null) listingsQuery = listingsQuery.gte("area_marla", filters.min_area_marla);
  if (filters.max_area_marla != null) listingsQuery = listingsQuery.lte("area_marla", filters.max_area_marla);
  if (filters.floors != null) {
    listingsQuery = filters.floors >= 3 ? listingsQuery.gte("floors", 3) : listingsQuery.eq("floors", filters.floors);
  }
  if (filters.beds != null) listingsQuery = listingsQuery.gte("beds", filters.beds);
  if (filters.baths != null) listingsQuery = listingsQuery.gte("baths", filters.baths);
  if (filters.q) {
    // A pasted Property ID reaching a results page (bookmarked link, back
    // button, etc. — the homepage search bar itself redirects straight to
    // the listing) should surface that exact listing, not get tokenized
    // into a full-text search that won't match a number against titles.
    const propertyId = parsePropertyId(filters.q);
    listingsQuery =
      propertyId != null
        ? listingsQuery.eq("listing_number", propertyId)
        : listingsQuery.textSearch("search_vector", filters.q, { type: "websearch", config: "english" });
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

  const societyListPromise =
    area && !society
      ? supabase.from("societies").select("id, name, slug").eq("area_id", area.id).eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as SocietySummary[] });

  const phaseListPromise = society
    ? supabase.from("society_phases").select("id, name, slug").eq("society_id", society.id).order("name")
    : Promise.resolve({ data: [] as PhaseSummary[] });

  // No GROUP BY support in PostgREST — counted client-side from the type
  // column of every active listing in the current scope. Capped
  // defensively; this is a "how many if I picked this type" sidebar hint,
  // not the paginated result set itself.
  let typeCountQuery = supabase
    .from("listings")
    .select("type")
    .eq("status", "active")
    .eq("city_id", city.id)
    .eq("purpose", params.purpose)
    .limit(5000);
  if (area) typeCountQuery = typeCountQuery.eq("area_id", area.id);
  if (society) typeCountQuery = typeCountQuery.eq("society_id", society.id);
  if (phase) typeCountQuery = typeCountQuery.eq("phase_id", phase.id);
  if (params.baseTypes?.length) typeCountQuery = typeCountQuery.in("type", params.baseTypes);

  const [
    { data: listingsRaw, count },
    { data: areaListRaw },
    { data: societyListRaw },
    { data: phaseListRaw },
    { data: typeRows },
  ] = await Promise.all([listingsQuery, areaListPromise, societyListPromise, phaseListPromise, typeCountQuery]);

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
    society,
    phase,
    filters,
    listings,
    total,
    totalPages,
    areaList: (areaListRaw ?? []) as AreaSummary[],
    societyList: (societyListRaw ?? []) as SocietySummary[],
    phaseList: (phaseListRaw ?? []) as PhaseSummary[],
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
  societySlug?: string;
  searchParams: RawSearchParams;
  baseTypes?: string[];
  basePath?: string;
  // See SearchResultsPage's own typeLabelOverride — without this, sections
  // like /plots and /commercial that span several `type` values with no
  // single one ever "active" fell back to a generic "Properties for Sale"
  // in the indexed <title>, even though their on-page H1 correctly said
  // "Plots"/"Commercial Properties". Keeps the two in sync.
  typeLabelOverride?: string;
}): Promise<Metadata> {
  const results = await fetchSearchResults(params);

  if (!results) {
    return { title: "Not found | ZProperty.pk" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zproperty.pk";
  const routeBase = params.basePath ?? `/${params.purpose}`;
  const basePath = params.areaSlug
    ? params.societySlug
      ? `${routeBase}/${params.citySlug}/${params.areaSlug}/${params.societySlug}/`
      : `${routeBase}/${params.citySlug}/${params.areaSlug}/`
    : `${routeBase}/${params.citySlug}/`;

  return searchMeta({
    purpose: params.purpose,
    type: results.filters.type,
    type_label_override: params.typeLabelOverride,
    area_name: results.area?.name,
    city_name: results.city.name,
    society_name: results.society?.name,
    phase_name: results.phase?.name,
    min_area_marla: results.filters.min_area_marla,
    max_area_marla: results.filters.max_area_marla,
    floors: results.filters.floors,
    count: results.total,
    canonicalUrl: results.filters.page > 1 ? `${siteUrl}${basePath}` : undefined,
    noIndex: results.total === 0,
  });
}
