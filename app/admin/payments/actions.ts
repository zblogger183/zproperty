"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";
import { activateSubscription } from "@/lib/payments/subscriptions";

export async function verifyBankTransferAction(transactionId: string, approved: boolean, note?: string) {
  const { user, admin } = await verifyAdmin();

  const { data: txn } = await admin
    .from("payment_transactions")
    .select("user_id, gateway_ref")
    .eq("id", transactionId)
    .single();

  if (!txn) throw new Error("Transaction not found");

  if (approved) {
    // gateway_ref stores "planSlug:billingCycle" — set when the transaction
    // was created in app/api/payments/bank-transfer/route.ts.
    const [planSlug, billingCycle] = (txn.gateway_ref ?? "free:monthly").split(":");

    const { data: plan } = await admin.from("subscription_plans").select("id, slug").eq("slug", planSlug).single();

    if (plan) {
      await activateSubscription({
        userId: txn.user_id,
        planId: plan.id,
        planSlug: plan.slug,
        billingCycle: billingCycle === "annual" ? "annual" : "monthly",
        transactionId,
      });
    }

    await admin
      .from("payment_transactions")
      .update({
        bank_verified_by: user.id,
        bank_verified_at: new Date().toISOString(),
      })
      .eq("id", transactionId);
  } else {
    await admin
      .from("payment_transactions")
      .update({
        status: "failed",
        bank_notes: note ?? "Rejected by admin",
      })
      .eq("id", transactionId);

    await admin.from("notifications").insert({
      user_id: txn.user_id,
      type: "payment_failed",
      title: "Bank Transfer Rejected",
      body: `Your bank transfer was not verified. ${note ?? ""}`,
      channel: "app",
    });
  }

  revalidatePath("/admin/payments/bank-transfer");

  return { ok: true };
}
