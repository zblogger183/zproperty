import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { activateSubscription } from "@/lib/payments/subscriptions";

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(`${siteUrl}/dashboard/subscription?error=payment_failed`);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return NextResponse.redirect(`${siteUrl}/dashboard/subscription?error=payment_failed`);
  }

  const metadata = session.metadata;
  const userId = metadata?.userId;
  const planId = metadata?.planId;
  const planSlug = metadata?.planSlug;
  const billingCycle = metadata?.billingCycle;
  const transactionId = metadata?.transactionId;

  if (userId && planId && planSlug && transactionId) {
    // The webhook (app/api/payments/webhooks/stripe/route.ts) also calls
    // activateSubscription for this same session — activateSubscription is
    // idempotent-safe to call twice (it cancels any existing active
    // subscription then inserts a new one), so whichever of the two fires
    // first "wins" and the second is a harmless no-op re-activation rather
    // than a duplicate charge or double-billing.
    await activateSubscription({
      userId,
      planId,
      planSlug,
      billingCycle: billingCycle === "annual" ? "annual" : "monthly",
      transactionId,
    });
  }

  return NextResponse.redirect(`${siteUrl}/dashboard/subscription?success=true`);
}
