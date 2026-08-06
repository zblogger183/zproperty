"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export async function togglePinTopicAction(topicId: string, isPinned: boolean) {
  const { admin } = await verifyAdmin();
  await admin.from("forum_topics").update({ is_pinned: isPinned }).eq("id", topicId);
  revalidatePath("/admin/forum");
  revalidatePath("/forum");
  return { ok: true };
}

export async function toggleCloseTopicAction(topicId: string, isClosed: boolean) {
  const { admin } = await verifyAdmin();
  await admin.from("forum_topics").update({ is_closed: isClosed }).eq("id", topicId);
  revalidatePath("/admin/forum");
  revalidatePath("/forum");
  return { ok: true };
}

export async function deleteTopicAction(topicId: string) {
  const { admin } = await verifyAdmin();
  await admin.from("forum_replies").delete().eq("topic_id", topicId);
  await admin.from("forum_topics").delete().eq("id", topicId);
  revalidatePath("/admin/forum");
  revalidatePath("/forum");
  return { ok: true };
}
