"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export async function approveProjectAction(projectId: string) {
  const { admin } = await verifyAdmin();

  await admin
    .from("projects")
    .update({ status_platform: "active", published_at: new Date().toISOString() })
    .eq("id", projectId);

  revalidatePath("/admin/projects/pending");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/new-projects");

  return { ok: true };
}

export async function rejectProjectAction(projectId: string, reason: string) {
  const { admin } = await verifyAdmin();

  await admin
    .from("projects")
    .update({ status_platform: "rejected", reject_reason: reason })
    .eq("id", projectId);

  revalidatePath("/admin/projects/pending");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);

  return { ok: true };
}

export async function featureProjectAction(projectId: string) {
  const { admin } = await verifyAdmin();

  await admin.from("projects").update({ is_featured: true }).eq("id", projectId);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/new-projects");

  return { ok: true };
}
