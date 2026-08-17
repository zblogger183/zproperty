import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils/formatPrice";
import { formatCnic } from "@/lib/utils";
import { AgentAdminActions } from "@/components/admin/AgentAdminActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Agent Detail | ZProperty Admin" };

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: user }, { data: profile }, { data: listings }, { data: leads }] = await Promise.all([
    admin.from("users").select("id, name, email, phone, is_active, created_at").eq("id", id).maybeSingle(),
    admin
      .from("agent_profiles")
      .select(
        "profile_slug, subscription_tier, subscription_end, cnic_number, cnic_verified, cnic_verified_at, active_listings, total_listings, total_leads",
      )
      .eq("user_id", id)
      .maybeSingle(),
    admin
      .from("listings")
      .select("id, slug, title, status, price, purpose, views_count, leads_count, created_at")
      .eq("agent_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("leads")
      .select("id, name, lead_type, status, created_at")
      .eq("agent_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!user || !profile) {
    notFound();
  }

  const allListings = listings ?? [];
  const totalViews = allListings.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0);
  const recentListings = allListings.slice(0, 5);

  return (
    <div className="px-6 py-6">
      <Link href="/admin/users/agents" className="text-sm text-primary hover:text-primary-mid">
        ← Agents
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">{user.name}</h1>
        {user.is_active ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary">Active</span>
        ) : (
          <span className="rounded-full border border-primary bg-white px-2 py-0.5 text-xs text-primary-mid">
            Suspended
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-primary bg-white p-5 md:col-span-1">
          <h2 className="mb-3 text-base font-bold text-black">Agent Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Email</dt>
              <dd className="text-black">{user.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Phone</dt>
              <dd className="text-black">{user.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">Plan</dt>
              <dd className="capitalize text-black">{profile.subscription_tier}</dd>
            </div>
            <div className="flex justify-between border-b border-primary pb-2">
              <dt className="text-primary-mid">CNIC</dt>
              <dd className="text-black">
                {profile.cnic_verified ? (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-primary">✓ Verified</span>
                ) : profile.cnic_number ? (
                  <span className="text-xs text-primary-mid">Pending ({formatCnic(profile.cnic_number)})</span>
                ) : (
                  <span className="text-xs text-primary-mid">Not submitted</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-primary-mid">Joined</dt>
              <dd className="text-black">{format(new Date(user.created_at), "MMM d, yyyy")}</dd>
            </div>
          </dl>
          <Link
            href={`/agents/${profile.profile_slug}`}
            target="_blank"
            className="mt-3 block text-xs text-primary underline"
          >
            View public profile →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 md:col-span-2 md:content-start">
          <div className="rounded-xl border border-primary bg-white p-4">
            <p className="text-2xl font-bold text-black">{profile.active_listings}</p>
            <p className="text-xs text-primary-mid">Active Listings</p>
          </div>
          <div className="rounded-xl border border-primary bg-white p-4">
            <p className="text-2xl font-bold text-black">{profile.total_leads}</p>
            <p className="text-xs text-primary-mid">Total Leads</p>
          </div>
          <div className="rounded-xl border border-primary bg-white p-4">
            <p className="text-2xl font-bold text-black">{totalViews}</p>
            <p className="text-xs text-primary-mid">Total Views</p>
          </div>

          <div className="col-span-3">
            <AgentAdminActions
              userId={id}
              isActive={user.is_active}
              cnicVerified={profile.cnic_verified}
              currentPlan={profile.subscription_tier}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-primary bg-white">
          <h2 className="border-b border-primary px-5 py-4 text-base font-bold text-black">Recent Listings</h2>
          {recentListings.length === 0 ? (
            <p className="py-6 text-center text-sm text-primary-mid">No listings yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentListings.map((listing) => (
                  <tr key={listing.id} className="border-b border-primary last:border-b-0">
                    <td className="max-w-[160px] truncate px-4 py-3 text-black">{listing.title}</td>
                    <td className="px-4 py-3 text-xs capitalize text-primary-mid">{listing.status}</td>
                    <td className="px-4 py-3 text-xs text-black">{formatPrice(listing.price, listing.purpose)}</td>
                    <td className="px-4 py-3 text-xs text-primary-mid">{listing.views_count} views</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-primary bg-white">
          <h2 className="border-b border-primary px-5 py-4 text-base font-bold text-black">Recent Leads</h2>
          {!leads || leads.length === 0 ? (
            <p className="py-6 text-center text-sm text-primary-mid">No leads yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-primary last:border-b-0">
                    <td className="px-4 py-3 text-black">{lead.name ?? "Anonymous"}</td>
                    <td className="px-4 py-3 text-xs capitalize text-primary-mid">{lead.lead_type}</td>
                    <td className="px-4 py-3 text-xs capitalize text-primary-mid">{lead.status}</td>
                    <td className="px-4 py-3 text-xs text-primary-mid">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
