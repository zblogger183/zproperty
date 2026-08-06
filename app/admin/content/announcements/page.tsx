import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";
import type { AnnouncementInput } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Announcements | SarZameenz Admin" };

export default async function AnnouncementsPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("settings").select("value").eq("key", "announcements_list").maybeSingle();
  const initial = Array.isArray(data?.value) ? (data.value as AnnouncementInput[]) : [];

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Announcements</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Site-wide announcement banners. Note: this list is separate from the single hero announcement banner
        managed on the Homepage settings page — that one is still the one actually rendered on the homepage today.
      </p>

      <div className="mt-6">
        <AnnouncementsManager initial={initial} />
      </div>
    </div>
  );
}
