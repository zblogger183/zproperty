"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateLeadStatusAction(leadId: string, newStatus: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("agent_id, status").eq("id", leadId).single();

  if (!lead || lead.agent_id !== user.id) throw new Error("Forbidden");

  const now = new Date().toISOString();

  await admin
    .from("leads")
    .update({ status: newStatus, last_activity: now, updated_at: now })
    .eq("id", leadId);

  await admin.from("lead_activities").insert({
    lead_id: leadId,
    user_id: user.id,
    activity: `Status changed from ${lead.status} to ${newStatus}`,
    old_value: lead.status,
    new_value: newStatus,
  });

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/crm");
  return { ok: true };
}

export async function addLeadNoteAction(leadId: string, note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("agent_id").eq("id", leadId).single();
  if (!lead || lead.agent_id !== user.id) throw new Error("Forbidden");

  const { data: inserted, error } = await admin
    .from("lead_notes")
    .insert({ lead_id: leadId, author_id: user.id, note })
    .select("id, note, created_at")
    .single();

  if (error || !inserted) throw new Error("Failed to add note.");

  await admin.from("leads").update({ last_activity: new Date().toISOString() }).eq("id", leadId);

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/crm");
  return inserted;
}
