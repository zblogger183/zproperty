import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateSubscription } from "@/lib/payments/subscriptions";

// SECURITY GAP, not just an untested integration: unlike JazzCash (which
// signs its callback with pp_SecureHash, verifiable locally — see
// lib/payments/jazzcash.ts), EasyPaisa's documented flow sends back only an
// `auth_token` and expects the merchant to make a second server-to-server
// call to confirm the final transaction status, rather than trusting query
// params directly. That confirmation call isn't implemented here — this
// currently trusts `orderId`/`responseCode` from the redirect as-is, which
// is spoofable. Do not treat a "success" redirect here as authoritative
// until that confirmation call is added once real EasyPaisa merchant docs
// and credentials are available (see the note in lib/payments/easypaisa.ts).
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

  if (responseCode === "0000") {
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
