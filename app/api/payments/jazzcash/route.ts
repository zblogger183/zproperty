import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateJazzCashParams } from "@/lib/payments/jazzcash";

export async function POST(request: NextRequest) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    planSlug?: string;
    billingCycle?: "monthly" | "annual";
    mobileNumber?: string;
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
      method: "jazzcash",
      status: "pending",
      // Round-trips through JazzCash only ever hand back our orderId
      // (pp_BillReference) — the callback re-derives which plan to
      // activate by reading this back off the transaction row, the same
      // convention used by the bank-transfer flow's gateway_ref.
      gateway_ref: `${plan.slug}:${body.billingCycle}`,
    })
    .select("id")
    .single();

  if (error || !transaction) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { postUrl, fields } = generateJazzCashParams({
    amount,
    orderId: transaction.id,
    description: `SarZameenz ${plan.name} Plan`,
    returnUrl: `${siteUrl}/api/payments/jazzcash/callback`,
    mobileNumber: body.mobileNumber,
  });

  return NextResponse.json({ postUrl, fields });
}
