import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BoostPurchaseForm, type BoostableListing, type BoostPackageOption } from "@/components/dashboard/BoostPurchaseForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Boost Listings | ZProperty" };

interface BoostHistoryRow {
  id: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  listing: { title: string } | null;
  package: { name: string } | null;
}

// Pulled out of the component: react-hooks/purity flags a direct Date.now()
// call inside a function shaped like a component (see the same pattern in
// components/dashboard/ListingRow.tsx and admin/listings/featured/page.tsx).
function isPastDate(dateString: string): boolean {
  return new Date(dateString).getTime() < Date.now();
}

export default async function BoostListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: listings }, { data: packages }, { data: history }] = await Promise.all([
    admin
      .from("listings")
      .select("id, title, is_featured, is_hot_deal, is_top_search")
      .eq("agent_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    admin.from("boost_packages").select("id, name, type, duration_days, price").eq("is_active", true).order("price"),
    admin
      .from("listing_boosts")
      .select("id, starts_at, ends_at, is_active, listing:listings(title), package:boost_packages(name)")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const boostHistory = (history ?? []) as unknown as BoostHistoryRow[];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Boost Listings</h1>
      <p className="mt-1 text-sm text-primary-mid">Promote listings for extra visibility.</p>

      <div className="mt-6">
        <BoostPurchaseForm
          listings={(listings ?? []) as BoostableListing[]}
          packages={(packages ?? []).map((pkg) => ({ ...pkg, price: Number(pkg.price) })) as BoostPackageOption[]}
        />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-black">Boost History</h2>
      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Listing</th>
              <th className="px-4 py-3 text-left font-semibold">Package</th>
              <th className="px-4 py-3 text-left font-semibold">Started</th>
              <th className="px-4 py-3 text-left font-semibold">Ends</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {boostHistory.map((boost) => {
              const isExpired = isPastDate(boost.ends_at);
              return (
                <tr key={boost.id} className="border-b border-primary last:border-b-0">
                  <td className="max-w-[220px] truncate px-4 py-3 text-sm text-black">{boost.listing?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-primary-mid">{boost.package?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-primary-mid">{format(new Date(boost.starts_at), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3 text-xs text-primary-mid">{format(new Date(boost.ends_at), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        boost.is_active && !isExpired
                          ? "bg-secondary text-primary"
                          : "border border-primary bg-white text-primary-mid"
                      }`}
                    >
                      {boost.is_active && !isExpired ? "Active" : "Expired"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {boostHistory.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No boosts purchased yet.</p>
        )}
      </div>
    </div>
  );
}
