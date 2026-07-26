import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications/inapp";
import { email } from "@/lib/notifications/email";
import { wa } from "@/lib/notifications/whatsapp";

export async function activateSubscription(params: {
  userId: string;
  planId: string;
  planSlug: string;
  billingCycle: "monthly" | "annual";
  transactionId: string;
}) {
  const admin = createAdminClient();

  const now = new Date();
  const endsAt = new Date(now);
  if (params.billingCycle === "annual") {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
  } else {
    endsAt.setMonth(endsAt.getMonth() + 1);
  }

  await admin
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: now.toISOString() })
    .eq("user_id", params.userId)
    .eq("status", "active");

  const { data: sub } = await admin
    .from("subscriptions")
    .insert({
      user_id: params.userId,
      plan_id: params.planId,
      status: "active",
      billing_cycle: params.billingCycle,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select("id")
    .single();

  if (sub) {
    await admin
      .from("payment_transactions")
      .update({ subscription_id: sub.id, status: "completed", completed_at: now.toISOString() })
      .eq("id", params.transactionId);
  }

  await admin
    .from("agent_profiles")
    .update({
      subscription_tier: params.planSlug,
      subscription_end: endsAt.toISOString(),
    })
    .eq("user_id", params.userId);

  await notify.paymentConfirmed(params.userId, params.planSlug);

  const [{ data: user }, { data: agentProfile }, { data: transaction }, { data: plan }] = await Promise.all([
    admin.from("users").select("email, name").eq("id", params.userId).single(),
    admin.from("agent_profiles").select("whatsapp").eq("user_id", params.userId).single(),
    admin.from("payment_transactions").select("amount").eq("id", params.transactionId).single(),
    admin.from("subscription_plans").select("name").eq("id", params.planId).single(),
  ]);

  const planName = plan?.name ?? params.planSlug;

  if (user?.email) {
    await email.paymentConfirmed({
      to: user.email,
      name: user.name ?? "there",
      planName,
      amount: transaction?.amount ?? 0,
      endsAt: endsAt.toISOString(),
    });
  }
  if (agentProfile?.whatsapp) {
    await wa.paymentConfirmed(agentProfile.whatsapp, planName, endsAt.toISOString());
  }

  return { subscription_id: sub?.id, ends_at: endsAt };
}
