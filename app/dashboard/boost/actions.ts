"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Boost purchases don't go through payment_transactions/bank-transfer —
// that table's `method` column is CHECK-constrained to exactly
// stripe/jazzcash/easypaisa/bank_transfer, and the existing admin bank
// transfer queue (app/admin/payments/bank-transfer + verifyBankTransferAction)
// unconditionally parses gateway_ref as "planSlug:billingCycle" for
// subscription activation. Reusing it for boosts would silently fail to
// activate the boost while still marking the transaction "verified" —
// worse than not having a payment step at all. Until boosts get a real
// gateway/verification path of their own, activation here is immediate and
// self-serve (no payment collected).
export async function activateBoostAction(listingId: string, packageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();

  const { data: listing } = await admin
    .from("listings")
    .select("agent_id, status")
    .eq("id", listingId)
    .single();

  if (!listing) throw new Error("Listing not found");
  if (listing.agent_id !== user.id) throw new Error("Forbidden");
  if (listing.status !== "active") throw new Error("Only active listings can be boosted.");

  const { data: pkg } = await admin
    .from("boost_packages")
    .select("id, type, duration_days, is_active")
    .eq("id", packageId)
    .single();

  if (!pkg || !pkg.is_active) throw new Error("Boost package not found.");

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + pkg.duration_days);

  const { error: boostError } = await admin.from("listing_boosts").insert({
    listing_id: listingId,
    agent_id: user.id,
    package_id: pkg.id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    is_active: true,
  });

  if (boostError) throw new Error(boostError.message);

  const updates: Record<string, unknown> = {};
  if (pkg.type === "featured") {
    updates.is_featured = true;
    updates.featured_until = endsAt.toISOString();
  } else if (pkg.type === "hot_deal") {
    updates.is_hot_deal = true;
    updates.hot_deal_until = endsAt.toISOString();
  } else if (pkg.type === "top_search") {
    // listings has no top_search-specific `_until` column, so this flag has
    // no independent expiry today — it's toggled on and stays on until
    // manually cleared (matches the schema as it exists, not something to
    // silently work around with an unrelated column).
    updates.is_top_search = true;
  }

  if (Object.keys(updates).length > 0) {
    await admin.from("listings").update(updates).eq("id", listingId);
  }

  revalidatePath("/dashboard/boost");
  revalidatePath("/dashboard/listings");
  revalidatePath("/admin/listings/featured");

  return { ok: true, endsAt: endsAt.toISOString() };
}
