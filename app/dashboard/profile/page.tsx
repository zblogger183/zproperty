import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileEditor, type EditableProfile } from "@/components/dashboard/profile/ProfileEditor";

export const dynamic = "force-dynamic";

export default async function ProfileBuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: profile }, { data: cities }] = await Promise.all([
    admin
      .from("agent_profiles")
      .select(
        `profile_slug, headline, bio, whatsapp, specialties, cities_served, languages,
         facebook_url, instagram_url, youtube_url, experience_years,
         user:users!agent_profiles_user_id_fkey(name, avatar_url, email, phone)`,
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    admin.from("cities").select("id, name, slug").eq("is_active", true).order("display_order"),
  ]);

  // Agent hasn't completed registration (no agent_profiles row) yet.
  if (!profile) redirect("/dashboard");

  return (
    <div className="px-6 py-6">
      <ProfileEditor profile={profile as unknown as EditableProfile} cities={cities ?? []} />
    </div>
  );
}
