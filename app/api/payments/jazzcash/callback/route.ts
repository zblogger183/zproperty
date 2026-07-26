import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyJazzCashCallback } from "@/lib/payments/jazzcash";
import { activateSubscription } from "@/lib/payments/subscriptions";

// Called by JazzCash's servers redirecting the browser back after payment —
// there is no authenticated user on this request, so all DB writes go
// through the service-role admin client.
export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { searchParams } = new URL(request.url);

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const orderId = params.pp_BillReference;
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

  if (!verifyJazzCashCallback(params)) {
    await admin.from("payment_transactions").update({ status: "failed" }).eq("id", transaction.id);
    return NextResponse.redirect(`${siteUrl}/dashboard/subscription?error=payment_failed`);
  }

  if (params.pp_ResponseCode === "000") {
    await admin
      .from("payment_transactions")
      .update({
        gateway_txn_id: params.pp_TxnRefNo ?? null,
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
