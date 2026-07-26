import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    slipImageUrl?: string;
  };

  if (!body.planSlug || !body.billingCycle || !body.slipImageUrl) {
    return NextResponse.json(
      { error: "planSlug, billingCycle and slipImageUrl are required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const [{ data: plan }, { data: profile }] = await Promise.all([
    admin
      .from("subscription_plans")
      .select("id, name, slug, price_monthly, price_annual")
      .eq("slug", body.planSlug)
      .eq("is_active", true)
      .single(),
    admin.from("users").select("name").eq("id", user.id).single(),
  ]);

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
      method: "bank_transfer",
      status: "pending",
      bank_slip_url: body.slipImageUrl,
      // Read back by the admin verification route to know which plan to
      // activate once a human approves the slip.
      gateway_ref: `${plan.slug}:${body.billingCycle}`,
    })
    .select("id")
    .single();

  if (error || !transaction) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }

  const { data: admins } = await admin.from("users").select("id").eq("role", "super_admin");

  if (admins && admins.length > 0) {
    await admin.from("notifications").insert(
      admins.map((adminUser) => ({
        user_id: adminUser.id,
        type: "bank_transfer_pending",
        title: "New Bank Transfer Submitted",
        body: `${profile?.name ?? "An agent"} submitted a PKR ${amount.toLocaleString("en-PK")} bank transfer`,
        data: { transaction_id: transaction.id },
        channel: "app",
      })),
    );
  }

  return NextResponse.json({ ok: true, transactionId: transaction.id });
}
