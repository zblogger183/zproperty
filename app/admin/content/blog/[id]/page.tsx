import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlogEditorClient, type BlogPost } from "@/components/admin/blog/BlogEditorClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit Blog Post | ZProperty Admin" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: post }, { data: categories }, { data: authors }] = await Promise.all([
    admin
      .from("blog_posts")
      .select(
        `id, title, slug, excerpt, content, cover_url, author_id, category_id, tags, status,
         published_at, is_featured, reading_time, meta_title, meta_desc, focus_keyword, updated_at`,
      )
      .eq("id", id)
      .single(),
    admin.from("blog_categories").select("id, name").order("sort"),
    admin.from("users").select("id, name").in("role", ["admin", "super_admin"]).order("name"),
  ]);

  if (!post) notFound();

  return (
    <BlogEditorClient
      post={post as unknown as BlogPost}
      categories={categories ?? []}
      authors={authors ?? []}
    />
  );
}
