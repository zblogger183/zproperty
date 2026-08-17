import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlertsManager, type AlertRow, type CityOption } from "@/components/buyer/AlertsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Property Alerts | ZProperty" };

export default async function PropertyAlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: alerts }, { data: cities }] = await Promise.all([
    supabase
      .from("property_alerts")
      .select("id, name, purpose, min_price, max_price, frequency, is_active, city:cities(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("cities").select("id, name").eq("is_active", true).order("display_order"),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Property Alerts</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Get notified when new listings match your criteria. Note: alert matching/delivery isn&apos;t wired up to a
        background job yet — this manages what you&apos;d be alerted about, not the notifications themselves.
      </p>

      <div className="mt-6">
        <AlertsManager initialAlerts={(alerts ?? []) as unknown as AlertRow[]} cities={(cities ?? []) as CityOption[]} />
      </div>
    </div>
  );
}
