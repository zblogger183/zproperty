import { createPublicClient } from "@/lib/supabase/public";

export interface HomeStats {
  listings: number;
  agents: number;
  cities: number;
  users: number;
}

interface PublicStatsRow {
  listings_count: number;
  agents_count: number;
  cities_count: number;
  users_count: number;
}

// `users` has RLS restricting reads to the caller's own row, so a direct
// anon-client count on it would silently come back 0 — get_public_stats()
// is a SECURITY DEFINER RPC (supabase/migrations/012_security_hardening.sql)
// that exposes only these four aggregate counts, never individual rows.
// Shared by the homepage and About page, both of which render <StatsBar>.
export async function getHomeStats(): Promise<HomeStats> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_public_stats").single();
  const row = data as unknown as PublicStatsRow | null;
  if (error || !row) return { listings: 0, agents: 0, cities: 0, users: 0 };

  return {
    listings: row.listings_count ?? 0,
    agents: row.agents_count ?? 0,
    cities: row.cities_count ?? 0,
    users: row.users_count ?? 0,
  };
}
