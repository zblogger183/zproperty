import Stripe from "stripe";

// `.env.local` declares STRIPE_SECRET_KEY with an empty value pending real
// credentials — `??` only falls back on null/undefined, not "", so an unset
// key here would still reach `new Stripe("")` and crash at module load
// (which happened during `next build`'s page-data collection). `||` covers
// the empty-string case too.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  // The installed stripe package (v22) types `apiVersion` as a literal
  // pinned to its own bundled version, not a free-form string — passing
  // '2024-06-20' (an older version) fails to typecheck against this
  // package. node_modules/stripe/cjs/apiVersion.d.ts has the current value.
  apiVersion: "2026-06-24.dahlia",
});

export async function createStripeCheckoutSession(params: {
  userId: string;
  userEmail: string;
  planName: string;
  planId: string;
  planSlug: string;
  amount: number; // PKR
  billingCycle: "monthly" | "annual";
  transactionId: string;
}): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment", // one-time payment (not subscription mode)
    customer_email: params.userEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "pkr",
          unit_amount: Math.round(params.amount * 100),
          product_data: {
            name: `ZProperty ${params.planName} Plan`,
            description: `${params.billingCycle === "annual" ? "Annual" : "Monthly"} subscription`,
          },
        },
      },
    ],
    metadata: {
      userId: params.userId,
      planId: params.planId,
      planSlug: params.planSlug,
      billingCycle: params.billingCycle,
      transactionId: params.transactionId,
    },
    success_url: `${siteUrl}/api/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/dashboard/subscription?error=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");

  return session.url;
}
