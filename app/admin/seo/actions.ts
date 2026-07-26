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
