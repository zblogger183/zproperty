import type Stripe from "stripe";
import { stripe } from "@/lib/payments/stripe";
import { activateSubscription } from "@/lib/payments/subscriptions";

// Next's App Router route handlers never apply automatic body parsing (that
// was a Pages Router `api.bodyParser` concern) — `request.text()` below
// already gets the raw, unparsed body Stripe's signature check requires, so
// no extra route config is needed here.

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Webhook signature invalid", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      const metadata = session.metadata;
      const userId = metadata?.userId;
      const planId = metadata?.planId;
      const planSlug = metadata?.planSlug;
      const billingCycle = metadata?.billingCycle;
      const transactionId = metadata?.transactionId;

      if (userId && planId && planSlug && transactionId) {
        // Kept in sync with app/api/payments/stripe/success/route.ts — see
        // the comment there on why calling activateSubscription from both
        // places is safe (it's the reliability path for when the browser
        // never makes it back to /success, e.g. tab closed mid-redirect).
        await activateSubscription({
          userId,
          planId,
          planSlug,
          billingCycle: billingCycle === "annual" ? "annual" : "monthly",
          transactionId,
        });
      }
    }
  }

  return new Response("ok");
}
