import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlogEditorClient } from "@/components/admin/blog/BlogEditorClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New Blog Post | SarZameenz Admin" };

export default async function NewBlogPostPage() {
  const admin = createAdminClient();

  const [{ data: categories }, { data: authors }] = await Promise.all([
    admin.from("blog_categories").select("id, name").order("sort"),
    admin.from("users").select("id, name").in("role", ["admin", "super_admin"]).order("name"),
  ]);

  return <BlogEditorClient categories={categories ?? []} authors={authors ?? []} />;
}
