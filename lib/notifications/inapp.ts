import { createAdminClient } from "@/lib/supabase/admin";

interface NotificationInput {
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel?: "app" | "email" | "whatsapp";
}

export async function createNotification(n: NotificationInput) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data ?? {},
    channel: n.channel ?? "app",
    is_read: false,
  });
}

export async function createNotificationForAllAdmins(n: Omit<NotificationInput, "user_id">) {
  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("users")
    .select("id")
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true);

  if (!admins?.length) return;

  await admin.from("notifications").insert(
    admins.map((a) => ({
      user_id: a.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data ?? {},
      channel: n.channel ?? "app",
      is_read: false,
    })),
  );
}

// Pre-built notification creators for common events.
export const notify = {
  listingApproved: (agentId: string, listingSlug: string) =>
    createNotification({
      user_id: agentId,
      type: "listing_approved",
      title: "Listing Approved!",
      body: "Your listing is now live on SarZameenz.",
      data: { slug: listingSlug },
    }),

  listingRejected: (agentId: string, reason: string) =>
    createNotification({
      user_id: agentId,
      type: "listing_rejected",
      title: "Listing Not Approved",
      body: `Reason: ${reason}`,
      data: { reason },
    }),

  cnicVerified: (agentId: string) =>
    createNotification({
      user_id: agentId,
      type: "cnic_verified",
      title: "CNIC Verified!",
      body: "You now have a verified badge on all your listings.",
    }),

  // Symmetric with cnicVerified above — Part 2's rejectCNICAction needs
  // this and everything is meant to route through this file rather than
  // inline .insert() calls, so this fills that gap.
  cnicRejected: (agentId: string, reason: string) =>
    createNotification({
      user_id: agentId,
      type: "cnic_rejected",
      title: "CNIC Verification Unsuccessful",
      body: `Your CNIC could not be verified. Reason: ${reason}. Please re-submit clear photos.`,
      data: { reason },
    }),

  newLead: (agentId: string, leadName: string, listingTitle: string) =>
    createNotification({
      user_id: agentId,
      type: "new_lead",
      title: "New Lead!",
      body: `${leadName || "Someone"} enquired about "${listingTitle}"`,
    }),

  paymentConfirmed: (userId: string, planName: string) =>
    createNotification({
      user_id: userId,
      type: "payment_confirm",
      title: "Payment Confirmed",
      body: `Your ${planName} plan is now active.`,
    }),

  subscriptionExpiring: (userId: string, daysLeft: number) =>
    createNotification({
      user_id: userId,
      type: "subscription_exp",
      title: "Subscription Expiring Soon",
      body: `Your plan expires in ${daysLeft} days. Renew now to avoid interruption.`,
      data: { days_left: daysLeft },
    }),
};
