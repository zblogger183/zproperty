"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/app/admin/listings/actions";

export interface PlanUpdateInput {
  price_monthly: number;
  price_annual: number | null;
  max_listings: number | null;
  max_photos: number | null;
  is_active: boolean;
}

export async function updatePlanAction(planId: string, input: PlanUpdateInput) {
  const { admin } = await verifyAdmin();

  const { error } = await admin
    .from("subscription_plans")
    .update({
      price_monthly: input.price_monthly,
      price_annual: input.price_annual,
      max_listings: input.max_listings,
      max_photos: input.max_photos,
      is_active: input.is_active,
    })
    .eq("id", planId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings/plans");
  revalidatePath("/dashboard/subscription");

  return { ok: true };
}
