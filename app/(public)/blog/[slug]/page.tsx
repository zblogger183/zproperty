import { cache } from "react";
import type { Metadata } from "next";
import type { JSONContent } from "@tiptap/react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createPublicClient } from "@/lib/supabase/public";
import { blogPostMeta } from "@/lib/seo/metadata";
import { SchemaScript, blogPostSchema } from "@/lib/seo/schemas";
import { Breadcrumb } from "@/components/portal/Breadcrumb";
import { TiptapRenderer } from "@/components/portal/blog/TiptapRenderer";
import { ShareBar } from "@/components/portal/blog/ShareBar";
import { BlogCard, type BlogCardPost } from "@/components/portal/blog/BlogCard";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zproperty.pk";

const POST_SELECT = `
    id, title, slug, excerpt, content, cover_url, og_image_url,
    published_at, updated_at, reading_time, views_count,
    tags, is_featured, category_id,
    meta_title, meta_desc, focus_keyword, robots, canonical_url,
    category:blog_categories(name, slug),
    author:users(name)
  `;

interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: JSONContent | null;
  cover_url: string | null;
  og_image_url: string | null;
  published_at: string | null;
  updated_at: string;
  reading_time: number | null;
  views_count: number;
  tags: string[];
  is_featured: boolean;
  category_id: string | null;
  meta_title: string | null;
  meta_desc: string | null;
  focus_keyword: string | null;
  robots: string | null;
  canonical_url: string | null;
  category: { name: string; slug: string } | null;
  author: { name: string } | null;
}

// generateMetadata and the page body both need the same post — cache()
// dedupes that to a single Supabase round trip per request.
const getPost = cache(async (slug: string) => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data as unknown as BlogPostDetail | null;
});

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Article not found | ZProperty.pk" };
  }

  return blogPostMeta({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    og_image_url: post.og_image_url,
    cover_url: post.cover_url,
    published_at: post.published_at,
    updated_at: post.updated_at,
    author_name: post.author?.name ?? null,
    meta_title: post.meta_title,
    meta_desc: post.meta_desc,
    focus_keyword: post.focus_keyword,
    robots: post.robots,
    canonical_url: post.canonical_url,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data: related } = await supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, cover_url, og_image_url, published_at, reading_time, views_count,
       category:blog_categories(name,slug), author:users(name)`,
    )
    .eq("status", "published")
    .eq("category_id", post.category_id)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(3);

  const relatedPosts = (related ?? []) as unknown as BlogCardPost[];
  const authorName = post.author?.name ?? "ZProperty Team";
  const coverImage = post.cover_url ?? post.og_image_url;
  const pageUrl = `${SITE_URL}/blog/${post.slug}`;

  return (
    <>
      <SchemaScript
        schema={blogPostSchema({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          cover_url: post.cover_url,
          og_image_url: post.og_image_url,
          published_at: post.published_at,
          updated_at: post.updated_at,
          author_name: post.author?.name ?? null,
        })}
      />

      <div className="mx-auto max-w-3xl px-6">
        <div className="pt-6">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              ...(post.category
                ? [{ label: post.category.name, href: `/blog/category/${post.category.slug}` }]
                : []),
              { label: post.title.slice(0, 40), href: `/blog/${slug}` },
            ]}
          />
        </div>

        <div className="pb-6 pt-8">
          {post.category && (
            <a
              href={`/blog/category/${post.category.slug}`}
              className="text-xs uppercase tracking-wider text-primary-mid hover:text-primary"
            >
              {post.category.name}
            </a>
          )}
          <h1 className="mt-2 text-3xl font-bold leading-tight text-black">{post.title}</h1>
          {post.excerpt && <p className="mt-3 text-base italic text-primary-mid">{post.excerpt}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-primary-mid">
            <span>By {authorName}</span>
            {post.published_at && <span>{format(new Date(post.published_at), "MMMM d, yyyy")}</span>}
            {post.reading_time != null && <span>{post.reading_time} min read</span>}
            <span>{post.views_count.toLocaleString()} views</span>
          </div>

          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary bg-white px-3 py-1 text-xs text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {coverImage && (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-primary">
            <Image src={coverImage} alt={post.title} fill priority className="object-cover" />
          </div>
        )}

        <div className="mt-8">
          <TiptapRenderer content={post.content} />
        </div>

        <ShareBar title={post.title} url={pageUrl} />

        <div className="mt-6 flex items-start gap-4 rounded-xl border border-primary bg-white p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-secondary">
            {authorName.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-xs text-primary-mid">Written by</p>
            <p className="text-base font-bold text-black">{authorName}</p>
            <p className="text-sm text-primary-mid">ZProperty Real Estate Team</p>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="pb-12">
            <h2 className="mb-4 mt-8 text-xl font-bold text-black">Related Articles</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
