import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { NavigationLinksManager } from "@/components/admin/NavigationLinksManager";
import type { NavLinkInput } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Navigation Links | SarZameenz Admin" };

export default async function NavigationLinksPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("settings").select("value").eq("key", "nav_links").maybeSingle();
  const initial = Array.isArray(data?.value) ? (data.value as NavLinkInput[]) : [];

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Navigation Links</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Manage site navigation. Note: components/portal/Navbar.tsx doesn&apos;t read this list yet — it renders a
        fixed set of links — so changes here aren&apos;t reflected on the live navbar until that&apos;s wired up.
      </p>

      <div className="mt-6">
        <NavigationLinksManager initial={initial} />
      </div>
    </div>
  );
}
