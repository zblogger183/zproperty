import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, MessageCircle, Phone, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { formatPrice } from "@/lib/utils/formatPrice";

export const dynamic = "force-dynamic";

function barWidth(value: number, base: number): string {
  const pct = base > 0 ? Math.min(100, (value / base) * 100) : 0;
  return `max(4px, ${pct}%)`;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: listings }, { data: allLeads }] = await Promise.all([
    admin
      .from("listings")
      .select(
        `id, slug, title, status, purpose, type, price,
         views_count, leads_count, calls_count, whatsapp_count,
         created_at, published_at, primary_image_url`,
      )
      .eq("agent_id", user.id)
      .order("views_count", { ascending: false }),
    admin.from("leads").select("id, lead_type, status, created_at").eq("agent_id", user.id),
  ]);

  const totalViews = listings?.reduce((sum, listing) => sum + listing.views_count, 0) ?? 0;
  const totalLeads = allLeads?.length ?? 0;
  const totalCalls = listings?.reduce((sum, listing) => sum + listing.calls_count, 0) ?? 0;
  const totalWhatsApp = listings?.reduce((sum, listing) => sum + listing.whatsapp_count, 0) ?? 0;
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : "0.0";
  const wonLeads = allLeads?.filter((lead) => lead.status === "won").length ?? 0;

  const callLeads = allLeads?.filter((lead) => lead.lead_type === "call").length ?? 0;
  const whatsappLeads = allLeads?.filter((lead) => lead.lead_type === "whatsapp").length ?? 0;
  const emailLeads = allLeads?.filter((lead) => lead.lead_type === "email").length ?? 0;
  const formLeads = allLeads?.filter((lead) => lead.lead_type === "form").length ?? 0;

  const performanceListings = (listings ?? []).filter(
    (listing) => listing.status === "active" || listing.status === "paused",
  );
  const visibleListings = performanceListings.slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-black">Analytics</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardStatCard label="Total Views" value={totalViews} icon={Eye} />
        <DashboardStatCard label="Total Leads" value={totalLeads} icon={Users} />
        <DashboardStatCard label="Phone Calls" value={totalCalls} icon={Phone} />
        <DashboardStatCard label="WhatsApp Clicks" value={totalWhatsApp} icon={MessageCircle} />
      </div>

      <div className="mb-6 mt-8 rounded-xl border border-primary bg-white p-6">
        <h2 className="mb-6 text-base font-bold text-black">Conversion Funnel</h2>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm font-medium text-black">
            <span>Views</span>
            <span>{totalViews.toLocaleString("en-PK")}</span>
          </div>
          <div className="h-8 rounded-lg bg-primary" style={{ width: barWidth(totalViews, totalViews) }} />
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm font-medium text-black">
            <span>Leads</span>
            <span>{totalLeads.toLocaleString("en-PK")}</span>
          </div>
          <div className="h-8 rounded-lg bg-primary-mid" style={{ width: barWidth(totalLeads, totalViews) }} />
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm font-medium text-black">
            <span>Calls</span>
            <span>{totalCalls.toLocaleString("en-PK")}</span>
          </div>
          <div
            className="h-8 rounded-lg bg-primary-mid opacity-80"
            style={{ width: barWidth(totalCalls, totalViews) }}
          />
        </div>

        <div className="mb-2">
          <div className="mb-1 flex justify-between text-sm font-medium text-black">
            <span>Won</span>
            <span>{wonLeads.toLocaleString("en-PK")}</span>
          </div>
          <div className="h-8 rounded-lg bg-secondary" style={{ width: barWidth(wonLeads, totalViews) }} />
        </div>

        <p className="mt-2 text-xs text-primary-mid">
          Overall conversion rate: {conversionRate}% (leads ÷ views)
        </p>
      </div>

      <div className="mb-6 mt-6 rounded-xl border border-primary bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-black">Lead Sources</h2>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <Phone className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
            <p className="text-2xl font-bold text-black">{callLeads}</p>
            <p className="mt-1 text-xs text-primary-mid">Call</p>
          </div>
          <div>
            <MessageCircle className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
            <p className="text-2xl font-bold text-black">{whatsappLeads}</p>
            <p className="mt-1 text-xs text-primary-mid">WhatsApp</p>
          </div>
          <div>
            <Users className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
            <p className="text-2xl font-bold text-black">{emailLeads}</p>
            <p className="mt-1 text-xs text-primary-mid">Email</p>
          </div>
          <div>
            <Eye className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
            <p className="text-2xl font-bold text-black">{formLeads}</p>
            <p className="mt-1 text-xs text-primary-mid">Form</p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <div className="flex items-center justify-between border-b border-primary px-5 py-4">
          <h2 className="text-base font-bold text-black">Listing Performance</h2>
          {performanceListings.length > 10 && (
            <Link href="/dashboard/listings" className="text-sm text-primary hover:text-primary-mid">
              View all →
            </Link>
          )}
        </div>

        {visibleListings.length === 0 ? (
          <p className="py-8 text-center text-sm text-primary-mid">No listings yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-primary text-xs text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Listing</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Views</th>
                <th className="px-4 py-3 text-left font-semibold">Leads</th>
                <th className="px-4 py-3 text-left font-semibold">Calls</th>
                <th className="px-4 py-3 text-left font-semibold">WA</th>
                <th className="px-4 py-3 text-left font-semibold">CVR</th>
              </tr>
            </thead>
            <tbody>
              {visibleListings.map((listing) => {
                const cvr =
                  listing.views_count > 0
                    ? `${((listing.leads_count / listing.views_count) * 100).toFixed(1)}%`
                    : "—";

                return (
                  <tr key={listing.id} className="border-b border-primary hover:bg-secondary/5">
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="line-clamp-1 text-sm font-medium text-black">{listing.title}</p>
                      <p className="text-xs text-primary-mid">{formatPrice(listing.price, listing.purpose)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-primary-mid">{listing.status}</td>
                    <td className="px-4 py-3 text-sm text-black">{listing.views_count}</td>
                    <td className="px-4 py-3 text-sm text-black">{listing.leads_count}</td>
                    <td className="px-4 py-3 text-sm text-black">{listing.calls_count}</td>
                    <td className="px-4 py-3 text-sm text-black">{listing.whatsapp_count}</td>
                    <td className="px-4 py-3 text-sm text-black">{cvr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
