"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export interface HomepageSettingsInput {
  hero_headline: string;
  hero_subheadline: string;
  stats_listings: string;
  stats_agents: string;
  stats_cities: string;
  stats_users: string;
  announcement_text: string;
  announcement_link: string;
  announcement_active: boolean;
}

export async function saveHomepageSettingsAction(settings: HomepageSettingsInput) {
  const { admin, user } = await verifyAdmin();

  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    // `value` is passed through as-is (plain string/boolean), never
    // JSON.stringify()'d — supabase-js serializes the whole request body
    // once, so pre-stringifying here would double-encode the jsonb column
    // (e.g. turn the boolean `true` into the stored string "true").
    value,
    category: "homepage",
    updated_by: user.id,
  }));

  const { error } = await admin.from("settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/content/homepage");

  return { ok: true };
}
