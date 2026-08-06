"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export interface NavLinkInput {
  id: string;
  label: string;
  href: string;
}

export async function saveNavigationLinksAction(links: NavLinkInput[]) {
  const { admin, user } = await verifyAdmin();

  const { error } = await admin
    .from("settings")
    .upsert({ key: "nav_links", value: links, category: "content", updated_by: user.id }, { onConflict: "key" });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/content/navigation");
  revalidatePath("/");

  return { ok: true };
}
