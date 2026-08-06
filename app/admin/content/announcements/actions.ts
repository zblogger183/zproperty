"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export interface AnnouncementInput {
  id: string;
  message: string;
  link: string;
  is_active: boolean;
}

export async function saveAnnouncementsAction(announcements: AnnouncementInput[]) {
  const { admin, user } = await verifyAdmin();

  const { error } = await admin
    .from("settings")
    .upsert(
      { key: "announcements_list", value: announcements, category: "content", updated_by: user.id },
      { onConflict: "key" },
    );

  if (error) throw new Error(error.message);

  revalidatePath("/admin/content/announcements");
  revalidatePath("/");

  return { ok: true };
}
