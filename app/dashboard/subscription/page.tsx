import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SubscriptionClient,
  type RecentPayment,
  type SubscriptionPlanData,
} from "@/components/dashboard/subscription/SubscriptionClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Subscription | SarZameenz" };

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: subscription }, { data: profile }, { data: plans }, { data: payments }] = await Promise.all([
    admin.from("subscriptions").select("ends_at").eq("user_id", user.id).eq("status", "active").maybeSingle(),
    admin.from("agent_profiles").select("subscription_tier, subscription_end").eq("user_id", user.id).maybeSingle(),
    admin
      .from("subscription_plans")
      .select("id, name, slug, price_monthly, price_annual")
      .eq("is_active", true)
      .order("sort_order"),
    admin
      .from("payment_transactions")
      .select("id, amount, method, status, gateway_ref, initiated_at")
      .eq("user_id", user.id)
      .order("initiated_at", { ascending: false })
      .limit(5),
  ]);

  const currentTier = profile?.subscription_tier ?? "free";
  const subscriptionEnd = profile?.subscription_end ?? subscription?.ends_at ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Subscription</h1>

      <div className="mt-6">
        <Suspense>
          <SubscriptionClient
            currentTier={currentTier}
            subscriptionEnd={subscriptionEnd}
            plans={(plans ?? []) as SubscriptionPlanData[]}
            recentPayments={(payments ?? []) as RecentPayment[]}
          />
        </Suspense>
      </div>
    </div>
  );
}
