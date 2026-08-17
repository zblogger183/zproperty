import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Agents | ZProperty Admin" };

const FILTER_TABS = ["all", "free", "pro", "elite", "verified", "unverified"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const PLAN_BADGE_CLASSES: Record<string, string> = {
  free: "border border-primary bg-white text-primary",
  pro: "bg-primary text-white",
  elite: "bg-secondary text-primary font-bold",
};

interface AgentProfileRow {
  user_id: string;
  profile_slug: string;
  subscription_tier: string;
  subscription_end: string | null;
  cnic_number: string | null;
  cnic_verified: boolean;
  active_listings: number;
  total_listings: number;
  total_leads: number;
  created_at: string;
}

interface AgentUserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter: FilterTab = FILTER_TABS.includes(filterParam as FilterTab) ? (filterParam as FilterTab) : "all";

  const admin = createAdminClient();

  const { data: agents } = await admin
    .from("agent_profiles")
    .select(
      "user_id, profile_slug, subscription_tier, subscription_end, cnic_number, cnic_verified, active_listings, total_listings, total_leads, created_at",
    )
    .order("created_at", { ascending: false });

  const agentProfiles = (agents ?? []) as AgentProfileRow[];

  const { data: agentUsers } =
    agentProfiles.length > 0
      ? await admin
          .from("users")
          .select("id, name, email, phone, is_active")
          .in(
            "id",
            agentProfiles.map((a) => a.user_id),
          )
      : { data: [] as AgentUserRow[] };

  const usersById = new Map((agentUsers ?? []).map((u) => [u.id, u as AgentUserRow]));

  let rows = agentProfiles.map((profile) => ({ profile, user: usersById.get(profile.user_id) ?? null }));

  if (filter === "free" || filter === "pro" || filter === "elite") {
    rows = rows.filter((row) => row.profile.subscription_tier === filter);
  } else if (filter === "verified") {
    rows = rows.filter((row) => row.profile.cnic_verified);
  } else if (filter === "unverified") {
    rows = rows.filter((row) => !row.profile.cnic_verified);
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Agents</h1>
        <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
          {rows.length}
        </span>
      </div>

      <div className="mb-6 mt-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/users/agents" : `/admin/users/agents?filter=${tab}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              filter === tab ? "bg-secondary text-primary" : "border border-primary text-primary"
            }`}
          >
            {tab}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Agent</th>
              <th className="px-4 py-3 text-left font-semibold">Plan</th>
              <th className="px-4 py-3 text-left font-semibold">CNIC</th>
              <th className="px-4 py-3 text-left font-semibold">Listings</th>
              <th className="px-4 py-3 text-left font-semibold">Leads</th>
              <th className="px-4 py-3 text-left font-semibold">Joined</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ profile, user }) => (
              <tr key={profile.user_id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-black">{user?.name ?? "Unknown agent"}</p>
                  <p className="text-xs text-primary-mid">{user?.email ?? "—"}</p>
                  <Link href={`/agents/${profile.profile_slug}`} target="_blank" className="text-xs text-primary">
                    View profile →
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${
                      PLAN_BADGE_CLASSES[profile.subscription_tier] ?? ""
                    }`}
                  >
                    {profile.subscription_tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-[10px]">
                  {profile.cnic_verified ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-primary">✓ Verified</span>
                  ) : profile.cnic_number ? (
                    <span className="text-primary-mid">Pending</span>
                  ) : (
                    <span className="text-primary-mid">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-black">
                  {profile.active_listings} / {profile.total_listings}
                </td>
                <td className="px-4 py-3 text-xs text-black">{profile.total_leads}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {format(new Date(profile.created_at), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/agents/${profile.user_id}`} className="text-xs text-primary underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && <p className="py-8 text-center text-sm text-primary-mid">No agents found.</p>}
      </div>
    </div>
  );
}
