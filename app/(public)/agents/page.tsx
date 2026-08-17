import { Suspense } from "react";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { AgentCard, type DirectoryAgent } from "@/components/portal/agents/AgentCard";
import { AgentsFilterBar } from "@/components/portal/agents/AgentsFilterBar";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Real Estate Agents in Pakistan | ZProperty",
  description:
    "Find verified real estate agents in Lahore, Karachi and Islamabad. All agents are CNIC-verified. Contact directly via WhatsApp.",
};

const TIER_ORDER: Record<string, number> = { elite: 0, pro: 1, free: 2 };

export default async function AgentsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; specialty?: string }>;
}) {
  const { city: cityFilter, specialty: specialtyFilter } = await searchParams;
  const supabase = createPublicClient();

  const [{ data: agentsRaw }, { data: cities }] = await Promise.all([
    supabase
      .from("public_agent_profiles")
      .select(
        `user_id, profile_slug, headline, experience_years, specialties, cnic_verified,
         subscription_tier, active_listings, total_listings, whatsapp, cities_served,
         name, avatar_url`,
      )
      .order("active_listings", { ascending: false })
      .limit(60),
    supabase.from("cities").select("id, name, slug").eq("is_active", true).order("display_order"),
  ]);

  let agents = (agentsRaw ?? []) as unknown as DirectoryAgent[];

  // subscription_tier sorts wrong as text ("elite" < "free" < "pro"
  // alphabetically) — Array.prototype.sort is stable, so this re-sort by
  // tier priority preserves the DB's active_listings-descending order
  // within each tier rather than needing a second explicit sort key.
  agents = [...agents].sort((a, b) => (TIER_ORDER[a.subscription_tier] ?? 2) - (TIER_ORDER[b.subscription_tier] ?? 2));

  if (cityFilter) {
    agents = agents.filter((agent) => agent.cities_served?.includes(cityFilter));
  }
  if (specialtyFilter) {
    agents = agents.filter((agent) => agent.specialties?.includes(specialtyFilter));
  }

  return (
    <>
      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">Find Your Agent</h1>
        <p className="mt-2 text-base text-white/70">Browse CNIC-verified agents across Pakistan</p>
      </div>

      <div className="sticky top-14 z-30">
        <Suspense fallback={<div className="h-[68px] border-b border-primary bg-white" />}>
          <AgentsFilterBar cities={cities ?? []} />
        </Suspense>
      </div>

      <p className="px-6 pt-4 text-sm text-black">{agents.length} agents found</p>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {agents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-black">No agents found.</p>
            <p className="mt-2 text-sm text-primary-mid">Try a different city or specialty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.user_id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
