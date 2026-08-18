import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateSubscription } from "@/lib/payments/subscriptions";
import { confirmEasyPaisaTransaction } from "@/lib/payments/easypaisa";

// Unlike JazzCash (which signs its callback with pp_SecureHash, verifiable
// locally — see lib/payments/jazzcash.ts), EasyPaisa's redirect params are
// unsigned, so `responseCode` from the query string is never treated as
// authoritative on its own — activation only happens after an independent
// server-to-server confirmation call (confirmEasyPaisaTransaction) confirms
// the transaction actually settled as paid.
export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { searchParams } = request.nextUrl;

  const orderId = searchParams.get("orderId");
  const responseCode = searchParams.get("responseCode");

  if (!orderId) {
    return NextResponse.redirect(`${siteUrl}/dashboard/subscription?error=payment_failed`);
  }

  const admin = createAdminClient();

  const { data: transaction } = await admin
    .from("payment_transactions")
    .select("id, user_id, gateway_ref")
    .eq("id", orderId)
    .single();

  if (!transaction) {
    return NextResponse.redirect(`${siteUrl}/dashboard/subscription?error=payment_failed`);
  }

  const { paid } = responseCode === "0000" ? await confirmEasyPaisaTransaction(orderId) : { paid: false };

  if (paid) {
    await admin
      .from("payment_transactions")
      .update({
        gateway_txn_id: searchParams.get("transactionId"),
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    const [planSlug, billingCycle] = (transaction.gateway_ref ?? "free:monthly").split(":");

    const { data: plan } = await admin.from("subscription_plans").select("id, slug").eq("slug", planSlug).single();

    if (plan) {
      await activateSubscription({
        userId: transaction.user_id,
        planId: plan.id,
        planSlug: plan.slug,
        billingCycle: billingCycle === "annual" ? "annual" : "monthly",
        transactionId: transaction.id,
      });
    }

    return NextResponse.redirect(`${siteUrl}/dashboard/subscription?success=true`);
  }

  await admin.from("payment_transactions").update({ status: "failed" }).eq("id", transaction.id);
  return NextResponse.redirect(`${siteUrl}/dashboard/subscription?error=payment_failed`);
}
