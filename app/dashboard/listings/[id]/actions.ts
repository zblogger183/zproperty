"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { editListingSchema, type EditListingInput } from "./schemas";

// Listings in these statuses can have their fields changed via
// updateListingAction. "rejected" is deliberately excluded — it must go
// through resubmitFromEditAction instead, which also flips status back to
// pending. "sold" and "expired" are terminal from the edit form's
// perspective (matches app/dashboard/listings/actions.ts, where renewing an
// expired listing is its own separate flow).
const EDITABLE_STATUSES = new Set(["pending", "active", "paused"]);

// Local to this file rather than imported from app/dashboard/listings/actions.ts
// because that file's verifyAgentOwnsListing isn't exported (same duplication
// pattern already used there for its own per-action ownership checks).
async function verifyAgentOwnsListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("agent_id, status, image_count")
    .eq("id", listingId)
    .single();

  if (!listing) throw new Error("Listing not found");
  if (listing.agent_id !== user.id) throw new Error("Forbidden");

  return { user, admin, listing };
}

export async function updateListingAction(listingId: string, rawFields: EditListingInput) {
  const { admin, listing } = await verifyAgentOwnsListing(listingId);
  if (!EDITABLE_STATUSES.has(listing.status)) {
    throw new Error(`A ${listing.status} listing can't be edited this way.`);
  }

  // Re-validated server-side with zod, not just trusted from the client —
  // a direct server-action call (e.g. via devtools) could otherwise submit
  // an arbitrary payload past the client form's own validation.
  const fields = editListingSchema.parse(rawFields);

  const { error } = await admin.from("listings").update(fields).eq("id", listingId);
  if (error) throw new Error("Failed to update listing.");

  revalidatePath("/dashboard/listings");
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  return { ok: true };
}

export async function resubmitFromEditAction(listingId: string, rawFields: EditListingInput) {
  const { admin, listing } = await verifyAgentOwnsListing(listingId);
  if (listing.status !== "rejected") throw new Error("Only rejected listings can be resubmitted.");

  const fields = editListingSchema.parse(rawFields);

  const { error } = await admin
    .from("listings")
    .update({ ...fields, status: "pending", reject_reason: null })
    .eq("id", listingId);
  if (error) throw new Error("Failed to resubmit listing.");

  revalidatePath("/dashboard/listings");
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  return { ok: true };
}

export async function deleteListingImageAction(listingId: string, imageId: string) {
  const { admin, listing } = await verifyAgentOwnsListing(listingId);

  const { data: image } = await admin
    .from("listing_images")
    .select("id, is_primary")
    .eq("id", imageId)
    .eq("listing_id", listingId)
    .single();
  if (!image) throw new Error("Image not found.");

  await admin.from("listing_images").delete().eq("id", imageId);

  const updates: Record<string, unknown> = { image_count: Math.max(0, listing.image_count - 1) };

  if (image.is_primary) {
    // The deleted photo was the listing's primary image — promote whichever
    // photo is now first by display_order, or clear it entirely if that was
    // the last photo, so listings.primary_image_url never points at a
    // deleted row.
    const { data: nextImage } = await admin
      .from("listing_images")
      .select("id, large_url, og_url")
      .eq("listing_id", listingId)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextImage) {
      await admin.from("listing_images").update({ is_primary: true }).eq("id", nextImage.id);
    }
    updates.primary_image_url = nextImage?.large_url ?? null;
    updates.og_image_url = nextImage?.og_url ?? null;
  }

  await admin.from("listings").update(updates).eq("id", listingId);

  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath("/dashboard/listings");
  return { ok: true };
}
