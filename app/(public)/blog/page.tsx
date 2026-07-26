import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { createPublicClient } from "@/lib/supabase/public";
import { blogPostMeta } from "@/lib/seo/metadata";
import { BlogCard, type BlogCardPost } from "@/components/portal/blog/BlogCard";
import { CategoryFilterBar, type CategoryFilterBarCategory } from "@/components/portal/blog/CategoryFilterBar";

export const revalidate = 3600;

// Next validates which named exports a page.tsx file may have (default,
// generateMetadata, generateStaticParams, route-segment config, ...) — an
// arbitrary extra export like a shared query-columns string risks tripping
// that, so this is duplicated in app/(public)/blog/category/[category]/page.tsx
// rather than exported from here for reuse.
const POST_COLUMNS = `id, title, slug, excerpt, cover_url, og_image_url,
             published_at, reading_time, views_count,
             category:blog_categories(name,slug),
             author:users(name)`;

export async function generateMetadata(): Promise<Metadata> {
  return blogPostMeta({
    title: "Real Estate Blog Pakistan",
    slug: "blog",
    excerpt:
      "Latest property news, buying guides, market updates and investment tips for Pakistan real estate.",
    meta_title: "Pakistan Real Estate Blog — Market Updates & Guides | SarZameenz",
    meta_desc:
      "Read the latest property news, buying guides, market trends and investment tips for real estate in Lahore, Karachi and Islamabad.",
    canonical_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarzameenz.com"}/blog`,
  });
}

export default async function BlogPage() {
  const supabase = createPublicClient();

  const [{ data: featuredPost }, { data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select(POST_COLUMNS)
      .eq("status", "published")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("blog_posts")
      .select(POST_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(12),
    supabase.from("blog_categories").select("id, name, slug").order("sort", { ascending: true }),
  ]);

  const featured = featuredPost as unknown as BlogCardPost | null;
  const articles = (posts ?? []) as unknown as BlogCardPost[];
  const categoryList = (categories ?? []) as CategoryFilterBarCategory[];

  const featuredAuthor = featured?.author?.name ?? "SarZameenz Team";

  return (
    <>
      <div className="bg-primary px-6 py-10 text-center">
        <h1 className="text-3xl font-bold text-white">SarZameenz Blog</h1>
        <p className="mt-2 text-base text-white/70">Property news, guides and market insights</p>
      </div>

      <CategoryFilterBar categories={categoryList} />

      {featured && (
        <div className="mx-auto max-w-5xl px-6 pt-8">
          <div className="flex flex-col overflow-hidden rounded-xl border border-primary bg-white md:flex-row">
            <div className="relative aspect-video md:w-1/2">
              {featured.cover_url || featured.og_image_url ? (
                <Image
                  src={featured.cover_url ?? featured.og_image_url ?? ""}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-mid">
                  <span className="text-2xl font-bold text-white">{featured.title.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center p-6 md:w-1/2">
              <span className="mb-3 inline-block w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                Featured
              </span>
              {featured.category && (
                <p className="mb-2 text-xs uppercase tracking-wider text-primary-mid">{featured.category.name}</p>
              )}
              <h2 className="text-2xl font-bold leading-tight text-black">{featured.title}</h2>
              {featured.excerpt && (
                <p className="mt-3 line-clamp-3 text-sm text-primary-mid">{featured.excerpt}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-primary-mid">
                <span>{featuredAuthor}</span>
                {featured.reading_time != null && <span>· {featured.reading_time} min read</span>}
                {featured.published_at && <span>· {format(new Date(featured.published_at), "MMM d, yyyy")}</span>}
              </div>
              <Link
                href={`/blog/${featured.slug}`}
                className="mt-4 inline-block w-fit rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
              >
                Read Article →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="mb-6 text-xl font-bold text-black">Latest Articles</h2>

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
