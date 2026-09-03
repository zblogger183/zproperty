import type { Metadata } from "next";
import { AGENT_CONTACT_COLUMNS, backfillAgentContacts, createPublicClient } from "@/lib/supabase/public";
import { getHomeStats } from "@/lib/stats";
import { homepageMeta } from "@/lib/seo/metadata";
import { SchemaScript, websiteSchema, organizationSchema } from "@/lib/seo/schemas";
import { HeroSection, type HeroCity } from "@/components/portal/home/HeroSection";
import { QuickLinksSection } from "@/components/portal/home/QuickLinksSection";
import { PopularSearches } from "@/components/portal/home/PopularSearches";
import { CitiesSection, type CitySummary } from "@/components/portal/home/CitiesSection";
import { FeaturedListings } from "@/components/portal/home/FeaturedListings";
import { ProjectsSection } from "@/components/portal/home/ProjectsSection";
import { SocietiesSection } from "@/components/portal/home/SocietiesSection";
import { ToolsBar } from "@/components/portal/home/ToolsBar";
import { WhyUsSection } from "@/components/portal/home/WhyUsSection";
import { StatsBar } from "@/components/portal/home/StatsBar";
import { LatestBlogSection } from "@/components/portal/home/LatestBlogSection";
import type { BlogCardPost } from "@/components/portal/blog/BlogCard";
import type { ListingCardData, ProjectCardData, SocietyCardData } from "@/types";

export const revalidate = 3600;

type SupabasePublicClient = ReturnType<typeof createPublicClient>;

export const metadata: Metadata = homepageMeta();

async function getCities(supabase: SupabasePublicClient): Promise<CitySummary[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, slug, listing_count")
    .eq("is_active", true)
    .order("display_order")
    .limit(6);

  if (error || !data) return [];
  return data as CitySummary[];
}

// Agent contact comes from the public_agent_contact view (supabase/
// migrations/005_public_agent_contact.sql), not `users` directly — `users`
// has RLS restricting SELECT to the row's own owner or an admin (003_rls.sql),
// so an anonymous embed of `users` would come back null for real visitors.
//
// That view is a JOIN (users + agent_profiles), and PostgREST's embedding
// support for join-based views is unverified (vs. the simple single-table
// public_agent_profiles view, which embeds reliably) — so this backfills
// any row where the embed comes back null via backfillAgentContacts, which
// batches one follow-up query for the whole page instead of one per row.
async function getFeaturedListings(
  supabase: SupabasePublicClient,
  purpose: "buy" | "rent",
): Promise<ListingCardData[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      `id, slug, title, purpose, rental_period, price, beds, baths, area_marla, primary_image_url, is_featured, is_hot_deal,
       agent_id, city:cities(name), area:areas(name), agent:public_agent_contact(${AGENT_CONTACT_COLUMNS})`,
    )
    .eq("status", "active")
    .eq("is_featured", true)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error || !data) return [];

  return backfillAgentContacts(supabase, data as unknown as ListingCardData[]);
}

async function getFeaturedProjects(supabase: SupabasePublicClient): Promise<ProjectCardData[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, status, min_price, max_price, cover_image_url, city:cities(name)")
    .eq("status_platform", "active")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error || !data) return [];
  return data as unknown as ProjectCardData[];
}

async function getFeaturedSocieties(supabase: SupabasePublicClient): Promise<SocietyCardData[]> {
  const { data, error } = await supabase
    .from("societies")
    .select("id, slug, name, developer_name, avg_price_marla, cover_image_url, city:cities(name, slug)")
    .eq("is_active", true)
    .order("name")
    .limit(6);

  if (error || !data) return [];
  return data as unknown as SocietyCardData[];
}

async function getLatestBlogPosts(supabase: SupabasePublicClient): Promise<BlogCardPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_url, og_image_url, published_at, reading_time, views_count, category:blog_categories(name, slug), author:users(name)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  if (error || !data) return [];
  return data as unknown as BlogCardPost[];
}

export default async function HomePage() {
  const supabase = createPublicClient();

  const [cities, listings, rentListings, projects, societies, blogPosts, stats] = await Promise.all([
    getCities(supabase),
    getFeaturedListings(supabase, "buy"),
    getFeaturedListings(supabase, "rent"),
    getFeaturedProjects(supabase),
    getFeaturedSocieties(supabase),
    getLatestBlogPosts(supabase),
    getHomeStats(),
  ]);

  const heroCities: HeroCity[] = cities.map((city) => ({ id: city.id, name: city.name, slug: city.slug }));

  return (
    <>
      {/* JSON-LD can't be injected into a literal <head> from a nested page
          (only the root layout renders <head>) — rendering the script tags
          directly is Next's own documented pattern, and schema.org allows
          JSON-LD anywhere in the document, not just <head>. */}
      <SchemaScript schema={websiteSchema()} />
      <SchemaScript schema={organizationSchema()} />

      <HeroSection cities={heroCities} stats={stats} />
      <QuickLinksSection />
      <PopularSearches />
      <CitiesSection cities={cities} />
      <FeaturedListings listings={listings} />
      <FeaturedListings
        listings={rentListings}
        title="Featured Properties for Rent"
        viewAllHref="/rent/lahore"
        emptyMessage="Featured rental properties will appear here once listings go live."
      />
      <ProjectsSection projects={projects} />
      <SocietiesSection societies={societies} />
      <ToolsBar />
      <WhyUsSection />
      <StatsBar stats={stats} />
      <LatestBlogSection posts={blogPosts} />
    </>
  );
}
