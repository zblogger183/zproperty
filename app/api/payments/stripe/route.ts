import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";

export async function POST(request: NextRequest) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    planSlug?: string;
    billingCycle?: "monthly" | "annual";
  };

  if (!body.planSlug || !body.billingCycle) {
    return NextResponse.json({ error: "planSlug and billingCycle are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: plan } = await admin
    .from("subscription_plans")
    .select("id, name, slug, price_monthly, price_annual")
    .eq("slug", body.planSlug)
    .eq("is_active", true)
    .single();

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const amount = body.billingCycle === "annual" ? (plan.price_annual ?? plan.price_monthly) : plan.price_monthly;

  const { data: transaction, error } = await admin
    .from("payment_transactions")
    .insert({
      user_id: user.id,
      amount,
      currency: "PKR",
      method: "stripe",
      status: "pending",
      gateway_ref: `${plan.slug}:${body.billingCycle}`,
    })
    .select("id")
    .single();

  if (error || !transaction) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }

  const url = await createStripeCheckoutSession({
    userId: user.id,
    userEmail: user.email,
    planName: plan.name,
    planId: plan.id,
    planSlug: plan.slug,
    amount,
    billingCycle: body.billingCycle,
    transactionId: transaction.id,
  });

  return NextResponse.json({ url });
}
