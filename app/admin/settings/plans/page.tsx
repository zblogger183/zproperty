import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlansEditor, type PlanRow } from "@/components/admin/PlansEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Subscription Plans | SarZameenz Admin" };

export default async function PlansSettingsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("subscription_plans")
    .select("id, name, slug, price_monthly, price_annual, max_listings, max_photos, is_active")
    .order("sort_order");

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Subscription Plans</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Edit pricing and limits for each plan. Changes apply the next time a listing/photo count or checkout is
        evaluated.
      </p>

      <div className="mt-6">
        <PlansEditor plans={(data ?? []) as PlanRow[]} />
      </div>
    </div>
  );
}
