"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export async function addRedirectAction(fromPath: string, toPath: string, type: 301 | 302) {
  const { admin, user } = await verifyAdmin();

  const { data, error } = await admin
    .from("redirects")
    .insert({ from_path: fromPath, to_path: toPath, type, created_by: user.id })
    .select("id, from_path, to_path, type, is_active, hit_count")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add redirect.");

  revalidatePath("/admin/seo/redirects");

  return data;
}

export async function deleteRedirectAction(id: string) {
  const { admin } = await verifyAdmin();

  await admin.from("redirects").delete().eq("id", id);

  revalidatePath("/admin/seo/redirects");

  return { ok: true };
}

export async function toggleRedirectAction(id: string, isActive: boolean) {
  const { admin } = await verifyAdmin();

  await admin.from("redirects").update({ is_active: isActive }).eq("id", id);

  revalidatePath("/admin/seo/redirects");

  return { ok: true };
}

export interface PageSeoInput {
  path: string;
  title: string;
  description: string;
  og_image: string;
  robots: string;
  canonical: string;
}

export async function upsertPageSeoAction(input: PageSeoInput) {
  const { admin } = await verifyAdmin();

  const { data, error } = await admin
    .from("page_seo")
    .upsert(
      {
        path: input.path,
        title: input.title,
        description: input.description,
        og_image: input.og_image || null,
        robots: input.robots || null,
        canonical: input.canonical || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "path" },
    )
    .select("id, path, title, description, og_image, robots, canonical")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save page SEO.");

  revalidatePath("/admin/seo/pages");

  return data;
}

export async function deletePageSeoAction(id: string) {
  const { admin } = await verifyAdmin();

  await admin.from("page_seo").delete().eq("id", id);

  revalidatePath("/admin/seo/pages");

  return { ok: true };
}

export async function saveRobotsTxtAction(content: string) {
  const { admin, user } = await verifyAdmin();

  const { error } = await admin
    .from("settings")
    // `value` is the raw string, not JSON.stringify()'d — see the same note
    // in app/admin/content/homepage/actions.ts for why pre-stringifying
    // would double-encode this jsonb column.
    .upsert({ key: "robots_txt", value: content, category: "seo", updated_by: user.id }, { onConflict: "key" });

  if (error) throw new Error(error.message);

  revalidatePath("/robots.txt");
  revalidatePath("/admin/seo/robots");

  return { ok: true };
}
