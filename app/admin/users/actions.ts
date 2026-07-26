"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/app/admin/listings/actions";
import { notify } from "@/lib/notifications/inapp";
import { email } from "@/lib/notifications/email";
import { wa } from "@/lib/notifications/whatsapp";

export async function approveCNICAction(agentUserId: string) {
  const { admin } = await verifyAdmin();

  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  await admin
    .from("agent_profiles")
    .update({
      cnic_verified: true,
      cnic_verified_at: new Date().toISOString(),
      cnic_verified_by: adminUser!.id,
    })
    .eq("user_id", agentUserId);

  await notify.cnicVerified(agentUserId);

  const [{ data: agentUser }, { data: agentProfile }] = await Promise.all([
    admin.from("users").select("email, name").eq("id", agentUserId).single(),
    admin.from("agent_profiles").select("whatsapp").eq("user_id", agentUserId).single(),
  ]);

  if (agentUser?.email) {
    await email.cnicVerified({ to: agentUser.email, agentName: agentUser.name ?? "there" });
  }
  if (agentProfile?.whatsapp) {
    await wa.cnicVerified(agentProfile.whatsapp);
  }

  revalidatePath("/admin/users/verification");
  revalidatePath("/admin");
  return { ok: true };
}

export async function rejectCNICAction(agentUserId: string, reason: string) {
  const { admin } = await verifyAdmin();

  // Clear CNIC data so the agent must re-submit.
  await admin
    .from("agent_profiles")
    .update({
      cnic_front_url: null,
      cnic_back_url: null,
      cnic_verified: false,
    })
    .eq("user_id", agentUserId);

  await notify.cnicRejected(agentUserId, reason);

  revalidatePath("/admin/users/verification");
  return { ok: true };
}

export async function suspendUserAction(userId: string) {
  const { admin } = await verifyAdmin();
  await admin.from("users").update({ is_active: false }).eq("id", userId);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/agents/${userId}`);
  return { ok: true };
}

export async function activateUserAction(userId: string) {
  const { admin } = await verifyAdmin();
  await admin.from("users").update({ is_active: true }).eq("id", userId);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/agents/${userId}`);
  return { ok: true };
}

export async function adminOverridePlanAction(userId: string, planSlug: string) {
  const { admin } = await verifyAdmin();

  const endsAt = new Date();
  endsAt.setFullYear(endsAt.getFullYear() + 1);

  await admin
    .from("agent_profiles")
    .update({
      subscription_tier: planSlug,
      subscription_end: endsAt.toISOString(),
    })
    .eq("user_id", userId);

  revalidatePath(`/admin/users/agents/${userId}`);
  return { ok: true };
}
