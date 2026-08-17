import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { RobotsEditor } from "@/components/admin/RobotsEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Robots.txt | ZProperty Admin" };

const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /dashboard

Sitemap: https://zproperty.pk/sitemap.xml
`;

export default async function RobotsTxtPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("settings").select("value").eq("key", "robots_txt").maybeSingle();

  const initialValue = typeof data?.value === "string" ? data.value : DEFAULT_ROBOTS_TXT;

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Robots.txt</h1>
      <p className="mt-1 text-sm text-primary-mid">Control which crawlers can index which parts of the site.</p>

      <div className="mt-6">
        <RobotsEditor initialValue={initialValue} />
      </div>
    </div>
  );
}
