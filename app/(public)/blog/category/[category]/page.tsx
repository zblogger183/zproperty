import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { baseMeta } from "@/lib/seo/metadata";
import { BlogCard, type BlogCardPost } from "@/components/portal/blog/BlogCard";
import { CategoryFilterBar, type CategoryFilterBarCategory } from "@/components/portal/blog/CategoryFilterBar";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarzameenz.com";

// generateMetadata and the page body both need the category row — cache()
// dedupes that to a single Supabase round trip per request.
const getCategory = cache(async (slug: string) => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  return data as CategoryFilterBarCategory | null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: "Category not found | SarZameenz.com" };
  }

  const title = `${category.name} — Pakistan Real Estate Blog | SarZameenz`;
  const description = `Browse ${category.name} articles — property news, guides and market insights for Pakistan real estate.`;

  return baseMeta({
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog/category/${category.slug}` },
    openGraph: { title, description, type: "website", siteName: "SarZameenz.com" },
    twitter: { card: "summary_large_image", title, description },
  });
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const supabase = createPublicClient();

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select(
        `id, title, slug, excerpt, cover_url, og_image_url,
             published_at, reading_time, views_count,
             category:blog_categories(name,slug),
             author:users(name)`,
      )
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false }),
    supabase.from("blog_categories").select("id, name, slug").order("sort", { ascending: true }),
  ]);

  const articles = (posts ?? []) as unknown as BlogCardPost[];
  const categoryList = (categories ?? []) as CategoryFilterBarCategory[];

  return (
    <>
      <div className="bg-primary px-6 py-10 text-center">
        <h1 className="text-3xl font-bold text-white">{category.name}</h1>
        <p className="mt-2 text-base text-white/70">Property news, guides and market insights</p>
      </div>

      <CategoryFilterBar categories={categoryList} activeSlug={category.slug} />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/blog" className="text-sm font-semibold text-primary hover:text-primary-mid">
          ← All Articles
        </Link>

        <h2 className="mb-6 mt-4 text-xl font-bold text-black">{category.name} Articles</h2>

        {articles.length === 0 ? (
          <p className="py-16 text-center text-primary-mid">No articles published yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
