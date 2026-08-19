import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { AgentContact, ListingCardData, ListingDetailData } from "@/types";

/**
 * For anonymous, publicly-readable data (cities, active listings, active
 * projects, settings) fetched from static/ISR pages. Unlike
 * lib/supabase/server.ts, this never touches cookies() — using the
 * cookie-bound server client here would force the whole route into dynamic
 * rendering even though these reads don't depend on the visitor's session.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

type PublicClient = ReturnType<typeof createPublicClient>;

// Shared between the primary embedded-select and the fallback query below,
// so both request the exact same columns regardless of which one resolves.
export const AGENT_CONTACT_COLUMNS =
  "id, name, whatsapp, phone, profile_slug, headline, experience_years, specialties, cnic_verified, subscription_tier, agency_id";

/**
 * public_agent_contact (supabase/migrations/005) is a view built on a JOIN
 * (users + agent_profiles), not a simple single-table projection like
 * public_agent_profiles — PostgREST's relationship auto-embedding is
 * reliable for the latter but unverified for the former. This backfills
 * `agent` for any row where the embed came back null despite a real
 * `agent_id`, via one batched follow-up query (not one query per row). If
 * the embed already worked for every row, this is a no-op — no extra query
 * fires at all.
 */
export async function backfillAgentContacts<
  T extends { agent_id: string | null; agent: unknown | null },
>(supabase: PublicClient, rows: T[]): Promise<T[]> {
  const missingAgentIds = Array.from(
    new Set(
      rows
        .filter((row): row is T & { agent_id: string } => row.agent === null && !!row.agent_id)
        .map((row) => row.agent_id),
    ),
  );

  if (missingAgentIds.length === 0) {
    return rows;
  }

  const { data } = await supabase
    .from("public_agent_contact")
    .select(AGENT_CONTACT_COLUMNS)
    .in("id", missingAgentIds);

  const byId = new Map(
    ((data ?? []) as unknown as AgentContact[]).map((agent) => [agent.id, agent]),
  );

  return rows.map((row) => {
    if (row.agent !== null || !row.agent_id) return row;
    const fallback = byId.get(row.agent_id);
    return fallback ? { ...row, agent: fallback } : row;
  });
}

/**
 * Fetches a single active listing by slug, with agent contact info — tries
 * the embedded query first, falls back to a second lookup against
 * public_agent_contact if the embed comes back null. Used by the listing
 * detail page.
 */
export async function getListingWithAgent(slug: string): Promise<ListingDetailData | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `*, city:cities(name, slug), area:areas(name, slug), society:societies(name, slug),
       phase:society_phases(name), block:society_blocks(name),
       agent:public_agent_contact(${AGENT_CONTACT_COLUMNS}),
       listing_images:listing_images(thumb_url, medium_url, large_url, og_url, alt_text, display_order, is_primary)`,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .order("display_order", { referencedTable: "listing_images", ascending: true })
    .maybeSingle();

  if (error || !data) return null;

  const listing = data as unknown as ListingDetailData;
  // Belt-and-suspenders: the `.order(..., { referencedTable })` above should
  // already sort the embed, but re-sorting the (small) array in code costs
  // nothing and guarantees correct order even if that option doesn't apply
  // for some reason.
  listing.listing_images = [...(listing.listing_images ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );

  const [resolved] = await backfillAgentContacts(supabase, [listing]);
  return resolved;
}

/**
 * Listings in the same city and of the same property type, priced within
 * 30% of the given listing, excluding itself. Used for the "Similar
 * Properties" section on the listing detail page.
 *
 * Note: the `city`/`area` embeds use the `city:cities(...)`/`area:areas(...)`
 * alias form (matching getListingWithAgent and the homepage's query) so the
 * result lands on ListingCardData's `city`/`area` fields — an unaliased
 * `cities(...)`/`areas(...)` embed would land under `.cities`/`.areas`
 * instead, silently leaving `.city`/`.area` undefined on every row.
 */
export async function getSimilarListings(
  supabase: PublicClient,
  cityId: string,
  type: string,
  price: number,
  excludeId: string,
): Promise<ListingCardData[]> {
  const minPrice = price * 0.7;
  const maxPrice = price * 1.3;

  const { data } = await supabase
    .from("listings")
    .select(
      `id, slug, title, purpose, rental_period, price, area_marla, beds, baths, primary_image_url, is_featured, is_hot_deal,
       agent_id, city:cities(name, slug), area:areas(name, slug), agent:public_agent_contact(${AGENT_CONTACT_COLUMNS})`,
    )
    .eq("city_id", cityId)
    .eq("type", type)
    .eq("status", "active")
    .neq("id", excludeId)
    .gte("price", minPrice)
    .lte("price", maxPrice)
    .limit(4);

  if (!data) return [];

  return backfillAgentContacts(supabase, data as unknown as ListingCardData[]);
}
