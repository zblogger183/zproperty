import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { DmClientsManager, type DmClientRow } from "@/components/admin/DmClientsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Marketing Clients | SarZameenz Admin" };

export default async function MarketingClientsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("dm_clients")
    .select("id, business_name, contact_name, contact_phone, package_name, monthly_fee, status")
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Marketing Clients</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Clients running digital marketing campaigns through SarZameenz (separate from platform listing agents).
      </p>

      <DmClientsManager initialClients={(data ?? []) as DmClientRow[]} />
    </div>
  );
}
