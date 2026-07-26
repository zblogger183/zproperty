import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification, notify } from "@/lib/notifications/inapp";
import { email } from "@/lib/notifications/email";
import { wa } from "@/lib/notifications/whatsapp";

type AdminClient = ReturnType<typeof createAdminClient>;

// Shared by the 7/3/1-day expiry checks below — each just varies the day
// offset, so this avoids writing the same date-range query three times.
async function checkExpiringIn(admin: AdminClient, daysLeft: number): Promise<number> {
  const target = new Date();
  target.setDate(target.getDate() + daysLeft);
  const dayStart = `${target.toISOString().slice(0, 10)}T00:00:00Z`;
  const dayEnd = `${target.toISOString().slice(0, 10)}T23:59:59Z`;

  const { data: expiring } = await admin
    .from("subscriptions")
    .select("user_id, plan_id, ends_at")
    .eq("status", "active")
    .gte("ends_at", dayStart)
    .lte("ends_at", dayEnd);

  for (const sub of expiring ?? []) {
    await notify.subscriptionExpiring(sub.user_id, daysLeft);

    const [{ data: user }, { data: agentProfile }, { data: plan }] = await Promise.all([
      admin.from("users").select("email, name").eq("id", sub.user_id).single(),
      admin.from("agent_profiles").select("whatsapp").eq("user_id", sub.user_id).single(),
      admin.from("subscription_plans").select("name").eq("id", sub.plan_id).single(),
    ]);

    const planName = plan?.name ?? "your current";

    if (user?.email) {
      await email.subscriptionExpiring({
        to: user.email,
        name: user.name ?? "there",
        planName,
        daysLeft,
        endsAt: sub.ends_at,
      });
    }
    if (agentProfile?.whatsapp) {
      await wa.subscriptionExpiring(agentProfile.whatsapp, planName, daysLeft);
    }
  }

  return expiring?.length ?? 0;
}

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const [checked7, checked3, checked1] = await Promise.all([
    checkExpiringIn(admin, 7),
    checkExpiringIn(admin, 3),
    checkExpiringIn(admin, 1),
  ]);

  // Expired subscriptions: downgrade to free and notify.
  const { data: expired } = await admin
    .from("subscriptions")
    .select("id, user_id")
    .eq("status", "active")
    .lt("ends_at", now.toISOString());

  for (const sub of expired ?? []) {
    await admin.from("subscriptions").update({ status: "expired" }).eq("id", sub.id);
    await admin.from("agent_profiles").update({ subscription_tier: "free" }).eq("user_id", sub.user_id);

    await createNotification({
      user_id: sub.user_id,
      type: "subscription_expired",
      title: "Subscription Expired",
      body: "Your plan has expired. You are now on the Free plan. Renew to restore your features.",
    });
  }

  return Response.json({
    ok: true,
    checked: checked7 + checked3 + checked1,
    expired: expired?.length ?? 0,
  });
}
