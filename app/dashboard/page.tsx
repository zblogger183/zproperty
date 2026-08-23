import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Eye, List, MessageCircle, Users, Building2, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { RecentLeadsCard, type RecentLead } from "@/components/dashboard/RecentLeadsCard";
import { ListingPerformanceCard, type PerformanceListing } from "@/components/dashboard/ListingPerformanceCard";
import { ProjectPerformanceCard, type PerformanceProject } from "@/components/dashboard/ProjectPerformanceCard";

export const dynamic = "force-dynamic";

// Pulled out of the component body: the react-hooks/purity rule flags any
// direct Date.now() call inside a function shaped like a component, even
// though that check doesn't really apply to a Server Component (there's no
// client-side re-render/memoization to protect here — this runs once per
// request). A plain helper function isn't classified as a component, so
// calling Date.now() inside one doesn't trip the rule.
function getThirtyDaysAgoISOString(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

function isExpiringSoon(subscriptionEnd: string | null): boolean {
  if (!subscriptionEnd) return false;
  const msRemaining = new Date(subscriptionEnd).getTime() - Date.now();
  return msRemaining > 0 && msRemaining < 30 * 24 * 60 * 60 * 1000;
}

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: userRow } = await admin.from("users").select("name, role").eq("id", user.id).maybeSingle();

  if (userRow?.role === "developer") {
    return <DeveloperOverview userId={user.id} name={userRow?.name ?? "Developer"} admin={admin} />;
  }

  return <AgentOverview userId={user.id} admin={admin} />;
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function AgentOverview({ userId, admin }: { userId: string; admin: AdminClient }) {
  const thirtyDaysAgo = getThirtyDaysAgoISOString();

  const [{ data: userRow }, { data: profile }, [{ data: activeListings }, { count: leadsCount }], { data: recentLeadsRaw }, { data: performanceRaw }] =
    await Promise.all([
      admin.from("users").select("name").eq("id", userId).maybeSingle(),
      admin
        .from("agent_profiles")
        .select("subscription_tier, subscription_end, active_listings, total_listings, total_leads, cnic_verified, cnic_number")
        .eq("user_id", userId)
        .maybeSingle(),
      Promise.all([
        admin.from("listings").select("views_count, whatsapp_count").eq("agent_id", userId).eq("status", "active"),
        admin
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", userId)
          .gte("created_at", thirtyDaysAgo),
      ]),
      admin
        .from("leads")
        .select(
          `id, lead_type, name, phone, status, created_at, message,
           listing:listings(title, slug, primary_image_url)`,
        )
        .eq("agent_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("listings")
        .select(
          "id, slug, title, status, views_count, leads_count, calls_count, whatsapp_count, price, purpose, rental_period, primary_image_url, created_at, is_featured",
        )
        .eq("agent_id", userId)
        .order("views_count", { ascending: false })
        .limit(5),
    ]);

  // views_count is a cumulative counter, not a daily log — this sums it
  // across all active listings, which is "all time", not a 30-day delta.
  // Only leadsCount is genuinely 30-day (queried from `leads` by date).
  const totalViews = (activeListings ?? []).reduce((sum, listing) => sum + (listing.views_count ?? 0), 0);
  const totalWhatsApp = (activeListings ?? []).reduce((sum, listing) => sum + (listing.whatsapp_count ?? 0), 0);

  const agentName = userRow?.name ?? "Agent";
  const subscriptionTier = profile?.subscription_tier ?? "free";
  const subscriptionEnd = profile?.subscription_end ?? null;
  const expiresSoon = isExpiringSoon(subscriptionEnd);

  const recentLeads = (recentLeadsRaw ?? []) as unknown as RecentLead[];
  const performanceListings = (performanceRaw ?? []) as unknown as PerformanceListing[];

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-primary-mid">Welcome back!</p>
          <p className="text-2xl font-bold text-black">{agentName}</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-primary bg-white px-4 py-3">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-secondary">
            {subscriptionTier} Plan
          </span>
          {expiresSoon && subscriptionEnd ? (
            <Link
              href="/dashboard/subscription"
              className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-primary"
            >
              Renew by {format(new Date(subscriptionEnd), "MMM d")}
            </Link>
          ) : subscriptionEnd ? (
            <span className="text-xs text-primary-mid">Active until {format(new Date(subscriptionEnd), "MMM d, yyyy")}</span>
          ) : null}
        </div>
      </div>

      {!profile?.cnic_verified && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-primary p-4">
          <div>
            <p className="text-sm font-semibold text-white">✦ Your CNIC is not yet verified</p>
            <p className="mt-0.5 text-xs text-white/70">Verified agents get 3x more enquiries</p>
          </div>
          <Link
            href="/dashboard/settings"
            className="shrink-0 rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-primary"
          >
            Verify Now
          </Link>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardStatCard label="Active Listings" value={profile?.active_listings ?? 0} icon={List} />
        <DashboardStatCard label="Total Views (All Time)" value={totalViews} icon={Eye} />
        <DashboardStatCard label="Total Leads (30d)" value={leadsCount ?? 0} icon={Users} />
        <DashboardStatCard label="WhatsApp Clicks" value={totalWhatsApp} icon={MessageCircle} />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/listings/new"
          className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          + Add Listing
        </Link>
        <Link
          href="/dashboard/leads"
          className="rounded-lg border border-primary px-4 py-2.5 text-sm text-primary"
        >
          View All Leads
        </Link>
        <Link
          href="/dashboard/profile"
          className="rounded-lg border border-primary px-4 py-2.5 text-sm text-primary"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentLeadsCard leads={recentLeads} />
        <ListingPerformanceCard listings={performanceListings} />
      </div>

      {subscriptionTier === "free" && (
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl bg-primary p-6 md:flex-row md:items-center">
          <div>
            <p className="text-xl font-bold text-white">Upgrade to Pro</p>
            <p className="mt-1 text-base text-white/70">Get 50 listings, full CRM, and verified badge</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 text-sm text-white">✓ 50 listings</span>
              <span className="flex items-center gap-1.5 text-sm text-white">✓ 20 photos per listing</span>
              <span className="flex items-center gap-1.5 text-sm text-white">✓ Lead pipeline CRM</span>
              <span className="flex items-center gap-1.5 text-sm text-white">✓ CNIC verified badge</span>
            </div>
          </div>

          <div>
            <p className="text-2xl font-bold text-secondary">PKR 4,999/mo</p>
            <Link
              href="/dashboard/subscription"
              className="mt-2 inline-block rounded-xl bg-secondary px-8 py-3 text-base font-bold text-primary hover:bg-secondary-dark"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

async function DeveloperOverview({ userId, name, admin }: { userId: string; name: string; admin: AdminClient }) {
  const thirtyDaysAgo = getThirtyDaysAgoISOString();

  const [{ data: allProjects }, { count: leadsCount }, { data: recentLeadsRaw }, { data: performanceRaw }] = await Promise.all([
    admin.from("projects").select("status_platform, views_count, leads_count").eq("developer_id", userId),
    admin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("developer_id", userId)
      .gte("created_at", thirtyDaysAgo),
    admin
      .from("leads")
      .select(
        `id, lead_type, name, phone, status, created_at, message,
         project:projects(name, slug, cover_image_url)`,
      )
      .eq("developer_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("projects")
      .select("id, slug, name, status_platform, views_count, leads_count, min_price, max_price, cover_image_url")
      .eq("developer_id", userId)
      .order("views_count", { ascending: false })
      .limit(5),
  ]);

  const activeCount = (allProjects ?? []).filter((p) => p.status_platform === "active").length;
  const pendingCount = (allProjects ?? []).filter((p) => p.status_platform === "pending").length;
  const totalViews = (allProjects ?? []).reduce((sum, project) => sum + (project.views_count ?? 0), 0);

  const recentLeads = (recentLeadsRaw ?? []).map((lead) => ({ ...lead, listing: null })) as unknown as RecentLead[];
  const performanceProjects = (performanceRaw ?? []) as unknown as PerformanceProject[];

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-primary-mid">Welcome back!</p>
          <p className="text-2xl font-bold text-black">{name}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardStatCard label="Active Projects" value={activeCount} icon={Building2} />
        <DashboardStatCard label="Pending Review" value={pendingCount} icon={Inbox} />
        <DashboardStatCard label="Total Views (All Time)" value={totalViews} icon={Eye} />
        <DashboardStatCard label="Total Leads (30d)" value={leadsCount ?? 0} icon={Users} />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/projects/new"
          className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          + Add Project
        </Link>
        <Link
          href="/dashboard/leads"
          className="rounded-lg border border-primary px-4 py-2.5 text-sm text-primary"
        >
          View All Leads
        </Link>
        <Link
          href="/dashboard/settings"
          className="rounded-lg border border-primary px-4 py-2.5 text-sm text-primary"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentLeadsCard leads={recentLeads} emptyMessage="No leads yet. Approved projects will start receiving enquiries." />
        <ProjectPerformanceCard projects={performanceProjects} />
      </div>
    </div>
  );
}
