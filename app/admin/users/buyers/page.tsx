import type { Metadata } from "next";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Buyers | SarZameenz Admin" };

interface BuyerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export default async function BuyersPage() {
  const admin = createAdminClient();

  const { data: buyers } = await admin
    .from("users")
    .select("id, name, email, phone, is_active, created_at")
    .eq("role", "buyer")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (buyers ?? []) as BuyerRow[];
  const buyerIds = rows.map((row) => row.id);

  const [{ data: savedRows }, { data: alertRows }] =
    buyerIds.length > 0
      ? await Promise.all([
          admin.from("saved_listings").select("user_id").in("user_id", buyerIds),
          admin.from("property_alerts").select("user_id").eq("is_active", true).in("user_id", buyerIds),
        ])
      : [{ data: [] }, { data: [] }];

  const savedCounts = new Map<string, number>();
  for (const row of savedRows ?? []) {
    savedCounts.set(row.user_id, (savedCounts.get(row.user_id) ?? 0) + 1);
  }
  const alertCounts = new Map<string, number>();
  for (const row of alertRows ?? []) {
    alertCounts.set(row.user_id, (alertCounts.get(row.user_id) ?? 0) + 1);
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Buyers</h1>
        <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
          {rows.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-primary-mid">Registered buyers.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email/Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Saved Listings</th>
              <th className="px-4 py-3 text-left font-semibold">Active Alerts</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((buyer) => (
              <tr key={buyer.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3 text-sm font-semibold text-black">{buyer.name}</td>
                <td className="px-4 py-3">
                  <p className="text-xs text-primary-mid">{buyer.email ?? "—"}</p>
                  <p className="text-xs text-primary-mid">{buyer.phone ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-sm text-black">{savedCounts.get(buyer.id) ?? 0}</td>
                <td className="px-4 py-3 text-sm text-black">{alertCounts.get(buyer.id) ?? 0}</td>
                <td className="px-4 py-3">
                  {buyer.is_active ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-primary">Active</span>
                  ) : (
                    <span className="rounded-full border border-primary bg-white px-2 py-0.5 text-[10px] text-primary-mid">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">{format(new Date(buyer.created_at), "MMM d, yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && <p className="py-8 text-center text-sm text-primary-mid">No buyers registered yet.</p>}
      </div>
    </div>
  );
}
