"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { listingSchema } from "@/lib/seo/schemas";
import { notify } from "@/lib/notifications/inapp";
import { email } from "@/lib/notifications/email";
import { wa } from "@/lib/notifications/whatsapp";
import type { AgentContact } from "@/types";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
type AdminClient = ReturnType<typeof createAdminClient>;

export async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).single();

  if (!data || !ADMIN_ROLES.has(data.role as string)) {
    throw new Error("Forbidden");
  }

  return { user, admin };
}

// Shared by approve (increment) and reject/deactivate (decrement) — all
// three need the same "read current count, then write" round trip against
// agent_profiles.active_listings. Exported so app/dashboard/listings/actions.ts
// can reuse the same counter mechanics for agent-initiated pause/activate/
// delete — those can't call deactivateListingAction directly since it's
// gated by verifyAdmin(), not listing ownership.
export async function adjustActiveListings(admin: AdminClient, agentId: string | null, delta: 1 | -1) {
  if (!agentId) return;

  const { data: profile } = await admin
    .from("agent_profiles")
    .select("active_listings")
    .eq("user_id", agentId)
    .single();

  if (!profile) return;

  const next = delta === 1 ? (profile.active_listings ?? 0) + 1 : Math.max(0, (profile.active_listings ?? 1) - 1);

  await admin.from("agent_profiles").update({ active_listings: next }).eq("user_id", agentId);
}

export async function approveListingAction(listingId: string) {
  const { admin } = await verifyAdmin();

  // Get listing to find agent
  const { data: listing } = await admin.from("listings").select("agent_id, slug").eq("id", listingId).single();

  if (!listing) throw new Error("Listing not found");

  // Approve listing
  await admin
    .from("listings")
    .update({
      status: "active",
      published_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", listingId);

  // Generate and store the RealEstateListing schema now that the listing
  // is live — done here (not on every page render) so the listing detail
  // page can serve schema_json straight from the row instead of recomputing
  // it per request.
  const { data: fullListing } = await admin
    .from("listings")
    .select(
      `*, city:cities(name,slug), area:areas(name,slug), agent:public_agent_contact(name, profile_slug, whatsapp)`,
    )
    .eq("id", listingId)
    .single();

  if (fullListing) {
    // public_agent_contact is a join-based view (users + agent_profiles),
    // and PostgREST's embed cardinality inference for those isn't reliable
    // (see lib/supabase/public.ts) — it can come back as an array instead
    // of a single object depending on how the relationship is inferred.
    const agentRaw = fullListing.agent as AgentContact | AgentContact[] | null;
    const agent = Array.isArray(agentRaw) ? (agentRaw[0] ?? null) : (agentRaw ?? null);
    const city = fullListing.city as { name: string; slug: string } | null;
    const area = fullListing.area as { name: string; slug: string } | null;

    const schema = listingSchema({
      listing: fullListing,
      agent,
      area_name: area?.name ?? "",
      city_name: city?.name ?? "",
    });

    await admin.from("listings").update({ schema_json: schema }).eq("id", listingId);
  }

  // Increment agent active_listings count
  await adjustActiveListings(admin, listing.agent_id, 1);

  if (listing.agent_id) {
    await notify.listingApproved(listing.agent_id, listing.slug);

    const [{ data: agentUser }, { data: agentProfile }] = await Promise.all([
      admin.from("users").select("email, name").eq("id", listing.agent_id).single(),
      admin.from("agent_profiles").select("whatsapp").eq("user_id", listing.agent_id).single(),
    ]);

    if (agentUser?.email) {
      await email.listingApproved({
        to: agentUser.email,
        agentName: agentUser.name ?? "there",
        listingTitle: fullListing?.title ?? "",
        listingSlug: listing.slug,
      });
    }
    if (agentProfile?.whatsapp) {
      await wa.listingApproved(agentProfile.whatsapp, fullListing?.title ?? "");
    }
  }

  // Revalidate pages
  revalidatePath("/admin/listings/pending");
  revalidatePath("/admin");
  revalidatePath(`/listing/${listing.slug}`);

  return { ok: true };
}

export async function rejectListingAction(listingId: string, reason: string, note?: string) {
  const { admin } = await verifyAdmin();

  const { data: listing } = await admin
    .from("listings")
    .select("agent_id, title, status")
    .eq("id", listingId)
    .single();

  if (!listing) throw new Error("Listing not found");

  const fullReason = note ? `${reason}. ${note}` : reason;

  await admin.from("listings").update({ status: "rejected", reject_reason: fullReason }).eq("id", listingId);

  // A listing rejected after already being live (re-moderation, rather than
  // the usual first-review path) needs the same active_listings decrement
  // deactivateListingAction applies below — otherwise the agent's active
  // count silently overcounts and the plan-limit check in
  // app/api/listings/route.ts never frees up the slot.
  if (listing.status === "active") {
    await adjustActiveListings(admin, listing.agent_id, -1);
  }

  if (listing.agent_id) {
    // notify.listingRejected's body is just "Reason: {reason}" — folding
    // the listing title into that string (rather than dropping it) keeps
    // an agent with multiple rejections able to tell which listing this is
    // about, without needing to change the shared helper's signature.
    await notify.listingRejected(listing.agent_id, `"${listing.title}" — ${fullReason}`);

    const [{ data: agentUser }, { data: agentProfile }] = await Promise.all([
      admin.from("users").select("email, name").eq("id", listing.agent_id).single(),
      admin.from("agent_profiles").select("whatsapp").eq("user_id", listing.agent_id).single(),
    ]);

    if (agentUser?.email) {
      await email.listingRejected({
        to: agentUser.email,
        agentName: agentUser.name ?? "there",
        listingTitle: listing.title,
        reason: fullReason,
      });
    }
    if (agentProfile?.whatsapp) {
      await wa.listingRejected(agentProfile.whatsapp, listing.title, fullReason);
    }
  }

  revalidatePath("/admin/listings/pending");
  revalidatePath("/admin");

  return { ok: true };
}

export async function deactivateListingAction(listingId: string, newStatus: "paused" | "expired" | "sold") {
  const { admin } = await verifyAdmin();

  const { data: listing } = await admin.from("listings").select("agent_id, status").eq("id", listingId).single();

  if (!listing) throw new Error("Listing not found");

  await admin.from("listings").update({ status: newStatus }).eq("id", listingId);

  // Only decrement if listing was previously active
  if (listing.status === "active") {
    await adjustActiveListings(admin, listing.agent_id, -1);
  }

  revalidatePath("/admin/listings");
  revalidatePath("/admin");

  return { ok: true };
}

export async function unfeatureListingAction(listingId: string) {
  const { admin } = await verifyAdmin();

  await admin.from("listings").update({ is_featured: false, featured_until: null }).eq("id", listingId);

  revalidatePath("/admin/listings/featured");
  revalidatePath("/admin/listings");

  return { ok: true };
}

export async function featureListingAction(listingId: string) {
  const { admin } = await verifyAdmin();

  const until = new Date();
  until.setDate(until.getDate() + 30);

  await admin
    .from("listings")
    .update({
      is_featured: true,
      featured_until: until.toISOString(),
    })
    .eq("id", listingId);

  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/admin/listings");
  revalidatePath("/admin/listings/featured");

  return { ok: true };
}
