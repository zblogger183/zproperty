import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { WhiteLabelManager, type WhiteLabelRow, type AgencyOption } from "@/components/admin/WhiteLabelManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "White Label | SarZameenz Admin" };

export default async function WhiteLabelPage() {
  const admin = createAdminClient();

  const [{ data: clients }, { data: agencies }] = await Promise.all([
    admin
      .from("white_label_clients")
      .select("id, domain, site_title, is_active, custom_domain_verified, monthly_fee_pkr, agency:agencies(name)")
      .order("created_at", { ascending: false }),
    admin.from("agencies").select("id, name").order("name"),
  ]);

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">White Label</h1>
      <p className="mt-1 text-sm text-primary-mid">Manage tenant custom-domain configuration for agency-branded sites.</p>

      <WhiteLabelManager
        initialClients={(clients ?? []) as unknown as WhiteLabelRow[]}
        agencies={(agencies ?? []) as AgencyOption[]}
      />
    </div>
  );
}
