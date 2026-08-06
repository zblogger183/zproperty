import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageSeoManager, type PageSeoRow } from "@/components/admin/PageSeoManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Page SEO | SarZameenz Admin" };

export default async function PageSEOPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("page_seo")
    .select("id, path, title, description, og_image, robots, canonical")
    .order("path");

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Page SEO</h1>
      <p className="mt-1 text-sm text-primary-mid">Per-page meta title and description overrides, keyed by URL path.</p>

      <PageSeoManager initialRows={(data ?? []) as PageSeoRow[]} />
    </div>
  );
}
