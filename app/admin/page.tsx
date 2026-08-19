import type { Metadata } from "next";
import Link from "next/link";
import { List, Clock, Users, ShieldCheck, Banknote, TrendingUp } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/admin/StatCard";
import { RecentPendingTable, type RecentPendingListing } from "@/components/admin/RecentPendingTable";
import { RecentTransactionsTable, type RecentTransaction } from "@/components/admin/RecentTransactionsTable";

// The task spec's Part 2 said `revalidate = 60`, but its own "Important
// Notes" section says admin pages must never use ISR and always be fresh —
// a direct contradiction. Went with the latter (more emphatic, and the
// product-sensible choice for a moderation dashboard: an admin seeing a
// stale "0 pending" count for up to 60s is a real problem). `dynamic =
// "force-dynamic"` rather than `revalidate = 0` because these queries use
// the Supabase client directly, not `fetch()` — `revalidate` only affects
// Next's fetch cache, so it wouldn't actually force fresh data here.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin Dashboard | ZProperty" };

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [
    { count: totalListings },
    { count: pendingListings },
    { count: totalAgents },
    { count: pendingCNIC },
    { count: bankTransfersPending },
    { data: recentListings },
    { data: recentTransactions },
  ] = await Promise.all([
    admin.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("users").select("*", { count: "exact", head: true }).eq("role", "agent"),
    // Matches app/admin/users/verification/page.tsx's own criteria exactly —
    // "unverified" alone (cnic_verified = false) counts every agent who
    // hasn't gone through verification at all, including ones who never
    // submitted anything, not just the ones actually waiting on a review.
    admin
      .from("agent_profiles")
      .select("*", { count: "exact", head: true })
      .eq("cnic_verified", false)
      .not("cnic_front_url", "is", null),
    admin
      .from("payment_transactions")
      .select("*", { count: "exact", head: true })
      .eq("method", "bank_transfer")
      .eq("status", "pending"),
    admin
      .from("listings")
      .select("id, title, status, created_at, price, type, purpose, rental_period, agent:public_agent_contact(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("payment_transactions")
      .select(
        "id, amount, method, status, created_at:initiated_at, user:users!payment_transactions_user_id_fkey(name)",
      )
      .order("initiated_at", { ascending: false })
      .limit(5),
  ]);

  const pendingListingsCount = pendingListings ?? 0;
  const pendingCNICCount = pendingCNIC ?? 0;
  const bankTransfersCount = bankTransfersPending ?? 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-7xl px-6 py-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <span className="ml-auto text-sm text-primary-mid">{today}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Active Listings" value={totalListings ?? 0} icon={List} href="/admin/listings" />
        <StatCard
          label="Pending Approval"
          value={pendingListingsCount}
          icon={Clock}
          href="/admin/listings/pending"
          urgent={pendingListingsCount > 0}
        />
        <StatCard label="Total Agents" value={totalAgents ?? 0} icon={Users} href="/admin/users/agents" />
        <StatCard
          label="CNIC Pending"
          value={pendingCNICCount}
          icon={ShieldCheck}
          href="/admin/users/verification"
          urgent={pendingCNICCount > 0}
        />
        <StatCard
          label="Bank Transfers"
          value={bankTransfersCount}
          icon={Banknote}
          href="/admin/payments/bank-transfer"
          urgent={bankTransfersCount > 0}
        />
        <StatCard label="Revenue" value="PKR --" icon={TrendingUp} href="/admin/payments" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {pendingListingsCount > 0 && (
          <Link
            href="/admin/listings/pending"
            className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
          >
            Review Pending Listings ({pendingListingsCount})
          </Link>
        )}
        {pendingCNICCount > 0 && (
          <Link
            href="/admin/users/verification"
            className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
          >
            Verify CNICs ({pendingCNICCount})
          </Link>
        )}
        {bankTransfersCount > 0 && (
          <Link
            href="/admin/payments/bank-transfer"
            className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
          >
            Bank Transfers ({bankTransfersCount})
          </Link>
        )}
        <Link
          href="/admin/content/blog/new"
          className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          + Add Blog Post
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentPendingTable listings={(recentListings ?? []) as unknown as RecentPendingListing[]} />
        <RecentTransactionsTable
          transactions={(recentTransactions ?? []) as unknown as RecentTransaction[]}
        />
      </div>
    </div>
  );
}
