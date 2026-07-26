import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Blog Posts | SarZameenz Admin" };

const STATUS_TABS = ["all", "draft", "published", "scheduled", "archived"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: "border border-primary bg-white text-primary",
  published: "bg-secondary text-primary",
  scheduled: "bg-primary-mid text-white",
  archived: "bg-primary text-white",
};

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  published_at: string | null;
  views_count: number | null;
  is_featured: boolean;
  reading_time: number | null;
  created_at: string;
  updated_at: string;
  category: { name: string; slug: string } | null;
  author: { name: string } | null;
}

export default async function BlogPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status: StatusFilter = STATUS_TABS.includes(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : "all";

  const admin = createAdminClient();

  const { data } = await admin
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, status, published_at, views_count, is_featured, reading_time,
       created_at, updated_at,
       category:blog_categories(name, slug),
       author:users(name)`,
    )
    .order("updated_at", { ascending: false });

  const posts = (data ?? []) as unknown as BlogPostRow[];

  const counts = posts.reduce<Record<string, number>>(
    (acc, post) => {
      acc.all += 1;
      acc[post.status] = (acc[post.status] ?? 0) + 1;
      return acc;
    },
    { all: 0, draft: 0, published: 0, scheduled: 0, archived: 0 },
  );

  const visiblePosts = status === "all" ? posts : posts.filter((post) => post.status === status);

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Blog Posts</h1>
        <Link
          href="/admin/content/blog/new"
          className="ml-auto rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          + New Post
        </Link>
      </div>

      <div className="mb-6 mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-white p-4">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/content/blog" : `/admin/content/blog?status=${tab}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              status === tab ? "bg-secondary text-primary" : "border border-primary text-primary"
            }`}
          >
            {tab} ({counts[tab] ?? 0})
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Views</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visiblePosts.map((post) => (
              <tr key={post.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="max-w-[280px] px-4 py-3">
                  <Link href={`/admin/content/blog/${post.id}`} className="font-medium text-black hover:underline">
                    {post.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-primary-mid">
                    {post.reading_time ? `${post.reading_time} min read` : ""}
                    {post.reading_time && post.excerpt ? " · " : ""}
                    {post.excerpt}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {post.category ? (
                    <span className="rounded-full bg-primary-mid px-2 py-0.5 font-semibold text-white">
                      {post.category.name}
                    </span>
                  ) : (
                    <span className="text-primary-mid">Uncategorized</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      STATUS_BADGE_CLASSES[post.status] ?? ""
                    }`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-primary-mid">{post.views_count ?? 0}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {post.status === "published" && post.published_at
                    ? format(new Date(post.published_at), "MMM d, yyyy")
                    : `Updated ${formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}`}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-xs">
                    <Link href={`/admin/content/blog/${post.id}`} className="font-semibold text-primary underline">
                      Edit
                    </Link>
                    {post.status === "published" && (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="font-semibold text-primary underline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visiblePosts.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-primary-mid">No blog posts yet. Create your first post.</p>
            <Link
              href="/admin/content/blog/new"
              className="mt-3 inline-block rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
            >
              + New Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
