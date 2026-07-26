import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types";

export interface ListingSearchParams {
  query?: string;
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export async function searchListings(params: ListingSearchParams): Promise<Listing[]> {
  const supabase = await createClient();

  let query = supabase.from("listings").select("*").limit(params.limit ?? 20);

  if (params.query) {
    query = query.textSearch("title", params.query);
  }
  if (params.city) {
    query = query.eq("city", params.city);
  }
  if (params.area) {
    query = query.eq("area", params.area);
  }
  if (params.minPrice) {
    query = query.gte("price", params.minPrice);
  }
  if (params.maxPrice) {
    query = query.lte("price", params.maxPrice);
  }

  const { data } = await query;
  return (data ?? []) as Listing[];
}
