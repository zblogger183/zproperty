"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// saved_listings and property_alerts both have an "own rows only" RLS
// policy (auth.uid() = user_id), so these run on the session client rather
// than the admin client — the same "write as the user, not the service
// role" preference used for the CNIC upload fix earlier.

export async function saveListingAction(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("saved_listings").upsert(
    { user_id: user.id, listing_id: listingId },
    { onConflict: "user_id,listing_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/buyer/saved");
  return { ok: true };
}

export async function unsaveListingAction(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listingId);

  revalidatePath("/buyer/saved");
  return { ok: true };
}

export interface AlertInput {
  name: string;
  purpose: "buy" | "rent";
  city_id: string;
  min_price: number | null;
  max_price: number | null;
  frequency: "instant" | "daily" | "weekly";
}

export async function createAlertAction(input: AlertInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("property_alerts").insert({
    user_id: user.id,
    name: input.name,
    purpose: input.purpose,
    city_id: input.city_id || null,
    min_price: input.min_price,
    max_price: input.max_price,
    frequency: input.frequency,
    channel: "app",
    is_active: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/buyer/alerts");
  return { ok: true };
}

export async function toggleAlertActiveAction(alertId: string, isActive: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("property_alerts").update({ is_active: isActive }).eq("id", alertId).eq("user_id", user.id);

  revalidatePath("/buyer/alerts");
  return { ok: true };
}

export async function deleteAlertAction(alertId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("property_alerts").delete().eq("id", alertId).eq("user_id", user.id);

  revalidatePath("/buyer/alerts");
  return { ok: true };
}
