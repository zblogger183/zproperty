"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { adjustActiveListings } from "@/app/admin/listings/actions";

// Ownership-based auth (not verifyAdmin()'s role-based check) — this is
// what lets an agent pause/activate/delete their OWN listings without
// admin rights. deactivateListingAction in app/admin/listings/actions.ts
// can't be reused directly for that reason (it's gated by verifyAdmin()),
// but the active_listings counter mechanics (adjustActiveListings) are pure
// DB mutations with no auth baked in, so those are shared.
async function verifyAgentOwnsListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("agent_id, status, slug")
    .eq("id", listingId)
    .single();

  if (!listing) throw new Error("Listing not found");
  if (listing.agent_id !== user.id) throw new Error("Forbidden");

  return { user, admin, listing };
}

export async function pauseListingAction(listingId: string) {
  const { user, admin, listing } = await verifyAgentOwnsListing(listingId);
  if (listing.status !== "active") throw new Error("Only active listings can be paused");

  await admin.from("listings").update({ status: "paused" }).eq("id", listingId);
  await adjustActiveListings(admin, user.id, -1);

  revalidatePath("/dashboard/listings");
  return { ok: true };
}

export async function activateListingAction(listingId: string) {
  const { user, admin, listing } = await verifyAgentOwnsListing(listingId);
  if (listing.status !== "paused") throw new Error("Only paused listings can be activated");

  await admin.from("listings").update({ status: "active" }).eq("id", listingId);
  await adjustActiveListings(admin, user.id, 1);

  revalidatePath("/dashboard/listings");
  return { ok: true };
}

export async function resubmitListingAction(listingId: string) {
  const { admin, listing } = await verifyAgentOwnsListing(listingId);
  if (listing.status !== "rejected") throw new Error("Only rejected listings can be resubmitted");

  await admin.from("listings").update({ status: "pending", reject_reason: null }).eq("id", listingId);

  revalidatePath("/dashboard/listings");
  return { ok: true };
}

export async function renewListingAction(listingId: string) {
  const { admin, listing } = await verifyAgentOwnsListing(listingId);
  if (listing.status !== "expired") throw new Error("Only expired listings can be renewed");

  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 90);

  await admin
    .from("listings")
    .update({
      status: "pending", // must go through approval again
      expires_at: newExpiry.toISOString(),
      reject_reason: null,
    })
    .eq("id", listingId);

  revalidatePath("/dashboard/listings");
  return { ok: true };
}

export async function deleteListingAction(listingId: string) {
  const { user, admin, listing } = await verifyAgentOwnsListing(listingId);

  // Soft delete only — marked 'sold' rather than removed. Listings are
  // never hard-deleted so lead history, analytics, and past-performance
  // data tied to this row stay intact.
  await admin.from("listings").update({ status: "sold" }).eq("id", listingId);

  if (listing.status === "active") {
    await adjustActiveListings(admin, user.id, -1);
  }

  revalidatePath("/dashboard/listings");
  return { ok: true };
}
