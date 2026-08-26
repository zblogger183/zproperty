import { createPublicClient } from "@/lib/supabase/public";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import type { Metadata } from "next";

interface PageSeoRow {
  title: string | null;
  description: string | null;
  og_image: string | null;
  robots: string | null;
  canonical: string | null;
}

/**
 * Resolves a static page's metadata against any admin-set override in
 * page_seo (keyed by exact pathname), falling back to the hardcoded
 * default for whichever fields the admin hasn't touched. Lets
 * /admin/seo/pages — a fully built editor that, until this, wrote to a
 * table nothing ever read — actually change what search engines see.
 */
export async function resolvePageSeo(
  path: string,
  fallback: { title: string; description: string },
): Promise<Metadata> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("page_seo")
    .select("title, description, og_image, robots, canonical")
    .eq("path", path)
    .maybeSingle();

  const row = data as PageSeoRow | null;
  const title = row?.title || fallback.title;
  const description = row?.description || fallback.description;
  const robots = row?.robots ?? "index,follow";

  return baseMeta({
    title,
    description,
    robots: { index: !robots.includes("noindex"), follow: !robots.includes("nofollow") },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: row?.canonical || `${SITE_URL}${path}` },
  });
}
