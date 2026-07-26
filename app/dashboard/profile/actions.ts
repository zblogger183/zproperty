"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UpdateAgentProfileInput {
  name: string;
  headline: string;
  bio: string;
  whatsapp: string;
  specialties: string[];
  cities_served: string[];
  languages: string[];
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  experience_years: number;
  avatar_url?: string;
}

export async function updateAgentProfileAction(data: UpdateAgentProfileInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();

  await admin
    .from("users")
    .update({
      name: data.name,
      ...(data.avatar_url ? { avatar_url: data.avatar_url } : {}),
    })
    .eq("id", user.id);

  // .select().single() on the update return gives us profile_slug for the
  // revalidatePath below without a separate lookup query.
  const { data: updated } = await admin
    .from("agent_profiles")
    .update({
      headline: data.headline,
      bio: data.bio,
      whatsapp: data.whatsapp.replace(/\D/g, "").replace(/^92/, "").replace(/^0/, ""),
      specialties: data.specialties,
      cities_served: data.cities_served,
      languages: data.languages,
      facebook_url: data.facebook_url || null,
      instagram_url: data.instagram_url || null,
      youtube_url: data.youtube_url || null,
      experience_years: data.experience_years,
    })
    .eq("user_id", user.id)
    .select("profile_slug")
    .single();

  revalidatePath("/dashboard/profile");
  if (updated?.profile_slug) {
    revalidatePath(`/agents/${updated.profile_slug}`);
  }

  return { ok: true };
}
