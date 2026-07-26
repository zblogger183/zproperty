import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarzameenz.com";

export const revalidate = 3600;

interface CityRow {
  slug: string;
}

interface AreaRow {
  slug: string;
  city: { slug: string } | null;
}

interface SocietyRow {
  slug: string;
  city: { slug: string } | null;
}

interface UpdatedSlugRow {
  slug: string;
  updated_at: string;
}

interface AgentRow {
  profile_slug: string;
  updated_at: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient();

  const [
    { data: cities },
    { data: areas },
    { data: societies },
    { data: listings },
    { data: projects },
    { data: blogPosts },
    { data: agents },
  ] = await Promise.all([
    admin.from("cities").select("slug").eq("is_active", true),
    admin.from("areas").select("slug, city:cities(slug)").eq("is_active", true),
    admin.from("societies").select("slug, city:cities(slug)").eq("is_active", true),
    admin
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(50000),
    admin.from("projects").select("slug, updated_at").eq("status_platform", "active"),
    admin.from("blog_posts").select("slug, updated_at").eq("status", "published"),
    admin.from("agent_profiles").select("profile_slug, updated_at"),
  ]);

  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/advertise`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/agents`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/new-projects`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/forum`, changeFrequency: "hourly", priority: 0.5 },
    ...["emi-calculator", "construction-cost", "area-converter", "roi-calculator", "rent-vs-buy", "stamp-duty"].map(
      (tool) => ({
        url: `${SITE_URL}/tools/${tool}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }),
    ),
  ];

  const cityPages: MetadataRoute.Sitemap = ((cities ?? []) as unknown as CityRow[]).flatMap((city) => [
    { url: `${SITE_URL}/buy/${city.slug}/`, changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${SITE_URL}/rent/${city.slug}/`, changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${SITE_URL}/plots/${city.slug}/`, changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${SITE_URL}/commercial/${city.slug}/`, changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${SITE_URL}/new-projects/city/${city.slug}/`, changeFrequency: "daily" as const, priority: 0.8 },
  ]);

  const areaPages: MetadataRoute.Sitemap = ((areas ?? []) as unknown as AreaRow[])
    .filter((area) => area.city)
    .flatMap((area) => {
      const citySlug = area.city?.slug;
      if (!citySlug) return [];
      return [
        { url: `${SITE_URL}/buy/${citySlug}/${area.slug}/`, changeFrequency: "hourly" as const, priority: 0.8 },
        { url: `${SITE_URL}/rent/${citySlug}/${area.slug}/`, changeFrequency: "hourly" as const, priority: 0.8 },
      ];
    });

  const societyPages: MetadataRoute.Sitemap = ((societies ?? []) as unknown as SocietyRow[])
    .filter((society) => society.city)
    .map((society) => ({
      url: `${SITE_URL}/area-guide/${society.city?.slug}/${society.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const listingPages: MetadataRoute.Sitemap = ((listings ?? []) as unknown as UpdatedSlugRow[]).map((listing) => ({
    url: `${SITE_URL}/listing/${listing.slug}`,
    lastModified: listing.updated_at,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const projectPages: MetadataRoute.Sitemap = ((projects ?? []) as unknown as UpdatedSlugRow[]).map((project) => ({
    url: `${SITE_URL}/new-projects/${project.slug}`,
    lastModified: project.updated_at,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = ((blogPosts ?? []) as unknown as UpdatedSlugRow[]).map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const agentPages: MetadataRoute.Sitemap = ((agents ?? []) as unknown as AgentRow[]).map((agent) => ({
    url: `${SITE_URL}/agents/${agent.profile_slug}`,
    lastModified: agent.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...cityPages,
    ...areaPages,
    ...societyPages,
    ...listingPages,
    ...projectPages,
    ...blogPages,
    ...agentPages,
  ];
}
