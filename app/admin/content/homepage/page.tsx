import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { HomepageSectionsEditor } from "@/components/admin/HomepageSectionsEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Homepage Sections | SarZameenz Admin" };

const HOMEPAGE_DEFAULTS: Record<string, string | boolean> = {
  hero_headline: "Find Your Property in Pakistan",
  hero_subheadline: "Verified listings. Trusted agents.",
  stats_listings: "12,500+",
  stats_agents: "2,800+",
  stats_cities: "3",
  stats_users: "50,000+",
  announcement_text: "",
  announcement_link: "",
  announcement_active: false,
};

export default async function HomepageSectionsPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("settings").select("key, value").eq("category", "homepage");

  const existing = new Map<string, string | boolean>(
    (data ?? []).map((row) => [row.key as string, row.value as string | boolean]),
  );

  const missingRows = Object.entries(HOMEPAGE_DEFAULTS)
    .filter(([key]) => !existing.has(key))
    .map(([key, value]) => ({ key, value, category: "homepage" }));

  if (missingRows.length > 0) {
    await admin.from("settings").upsert(missingRows, { onConflict: "key" });
  }

  const settings: Record<string, string | boolean> = { ...HOMEPAGE_DEFAULTS };
  for (const [key, value] of existing) {
    settings[key] = value;
  }

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Homepage Sections</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Edit the hero text, stats bar, and announcement banner shown on the homepage.
      </p>

      <div className="mt-6">
        <HomepageSectionsEditor initialSettings={settings} />
      </div>
    </div>
  );
}
