import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsClient, type SettingsProfile } from "@/components/dashboard/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("agent_profiles")
    .select("cnic_number, cnic_front_url, cnic_back_url, cnic_verified, cnic_verified_at, subscription_tier")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  return <SettingsClient profile={profile as SettingsProfile} userEmail={user.email} />;
}
