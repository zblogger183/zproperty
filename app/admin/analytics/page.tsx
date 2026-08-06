import type { Metadata } from "next";
import { Eye, Users, Building2, Banknote, TrendingUp, List } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Platform Analytics | SarZameenz Admin" };

const STATUS_ORDER = ["active", "pending", "paused", "rejected", "expired", "sold"] as const;

const STATUS_BAR_CLASSES: Record<string, string> = {
  active: "bg-secondary",
  pending: "bg-primary",
  paused: "bg-primary-mid",
  rejected: "bg-primary-mid opacity-60",
  expired: "bg-primary-mid opacity-40",
  sold: "bg-primary opacity-70",
};

function barWidth(value: number, base: number): string {
  const pct = base > 0 ? Math.min(100, (value / base) * 100) : 0;
  return `max(4px, ${pct}%)`;
}

export default async function PlatformAnalyticsPage() {
  const admin = createAdminClient();

  const [
    { count: totalListings },
    { count: totalAgents },
    { count: totalBuyers },
    { count: totalLeads },
    { data: listingStatuses },
    { data: transactions },
    { data: cityListings },
  ] = await Promise.all([
    admin.from("listings").select("*", { count: "exact", head: true }),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "agent"),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "buyer"),
    admin.from("leads").select("*", { count: "exact", head: true }),
    admin.from("listings").select("status"),
    admin.from("payment_transactions").select("amount, status").eq("status", "completed"),
    admin.from("listings").select("city:cities(name)").eq("status", "active"),
  ]);

  const statusCounts = (listingStatuses ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

  const totalRevenue = (transactions ?? []).reduce((sum, txn) => sum + Number(txn.amount), 0);

  const cityCounts = (cityListings ?? []).reduce<Record<string, number>>((acc, row) => {
    const city = (row as unknown as { city: { name: string } | null }).city;
    if (city?.name) acc[city.name] = (acc[city.name] ?? 0) + 1;
    return acc;
  }, {});
  const topCities = Object.entries(cityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCityCount = Math.max(1, ...topCities.map(([, count]) => count));

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Platform Analytics</h1>
      <p className="mt-1 text-sm text-primary-mid">Site-wide traffic and conversion analytics.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Listings" value={totalListings ?? 0} icon={List} href="/admin/listings" />
        <StatCard label="Total Agents" value={totalAgents ?? 0} icon={Users} href="/admin/users/agents" />
        <StatCard label="Total Buyers" value={totalBuyers ?? 0} icon={Building2} href="/admin/users/buyers" />
        <StatCard label="Total Leads" value={totalLeads ?? 0} icon={Eye} />
        <StatCard
          label="Revenue"
          value={`PKR ${totalRevenue.toLocaleString("en-PK")}`}
          icon={Banknote}
          href="/admin/payments"
        />
      </div>

      <div className="mb-6 mt-8 rounded-xl border border-primary bg-white p-6">
        <h2 className="mb-6 text-base font-bold text-black">Listings by Status</h2>
        {STATUS_ORDER.map((status) => (
          <div key={status} className="mb-4 last:mb-0">
            <div className="mb-1 flex justify-between text-sm font-medium capitalize text-black">
              <span>{status}</span>
              <span>{statusCounts[status] ?? 0}</span>
            </div>
            <div
              className={`h-6 rounded-lg ${STATUS_BAR_CLASSES[status]}`}
              style={{ width: barWidth(statusCounts[status] ?? 0, maxStatusCount) }}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-primary bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-bold text-black">Top Cities (Active Listings)</h2>
        </div>
        {topCities.length === 0 ? (
          <p className="text-sm text-primary-mid">No active listings yet.</p>
        ) : (
          topCities.map(([city, count]) => (
            <div key={city} className="mb-3 last:mb-0">
              <div className="mb-1 flex justify-between text-sm font-medium text-black">
                <span>{city}</span>
                <span>{count}</span>
              </div>
              <div className="h-5 rounded-lg bg-primary" style={{ width: barWidth(count, maxCityCount) }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
