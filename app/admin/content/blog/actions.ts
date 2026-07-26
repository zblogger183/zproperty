"use server";

import { revalidatePath } from "next/cache";
import type { JSONContent } from "@tiptap/react";
import { verifyAdmin } from "@/app/admin/listings/actions";

export type BlogPostStatus = "draft" | "published" | "scheduled" | "archived";

export interface SaveBlogPostInput {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: JSONContent;
  cover_url?: string | null;
  author_id: string;
  category_id?: string | null;
  tags?: string[];
  status: BlogPostStatus;
  published_at?: string | null;
  is_featured?: boolean;
  reading_time?: number | null;
  meta_title?: string | null;
  meta_desc?: string | null;
  focus_keyword?: string | null;
}

export async function saveBlogPostAction(input: SaveBlogPostInput) {
  const { admin } = await verifyAdmin();

  // Only backfill published_at on the transition into "published" — an
  // explicit published_at (e.g. a scheduled post being edited) is left alone.
  const publishedAt =
    input.status === "published" && !input.published_at ? new Date().toISOString() : (input.published_at ?? null);

  const payload = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt ?? null,
    content: input.content,
    cover_url: input.cover_url ?? null,
    author_id: input.author_id,
    category_id: input.category_id ?? null,
    tags: input.tags ?? [],
    status: input.status,
    published_at: publishedAt,
    is_featured: input.is_featured ?? false,
    reading_time: input.reading_time ?? null,
    meta_title: input.meta_title ?? null,
    meta_desc: input.meta_desc ?? null,
    focus_keyword: input.focus_keyword ?? null,
  };

  let id = input.id;
  let slug = input.slug;

  if (id) {
    const { data, error } = await admin.from("blog_posts").update(payload).eq("id", id).select("id, slug").single();

    if (error || !data) throw new Error(error?.message ?? "Failed to update post.");
    slug = data.slug;
  } else {
    const { data, error } = await admin.from("blog_posts").insert(payload).select("id, slug").single();

    if (error || !data) throw new Error(error?.message ?? "Failed to create post.");
    id = data.id;
    slug = data.slug;
  }

  revalidatePath("/admin/content/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);

  return { id: id!, slug };
}

export async function deleteBlogPostAction(id: string) {
  const { admin } = await verifyAdmin();

  // Never hard-delete — archiving keeps the row (and its URL history/SEO
  // value) around while removing it from public listing/index pages.
  await admin.from("blog_posts").update({ status: "archived" }).eq("id", id);

  revalidatePath("/admin/content/blog");
  revalidatePath("/blog");

  return { ok: true };
}
