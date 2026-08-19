import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { AGENT_CONTACT_COLUMNS, backfillAgentContacts } from "@/lib/supabase/public";
import { PendingListingsClient } from "@/components/admin/PendingListingsClient";
import type { PendingListing } from "@/components/admin/PendingListingCard";

// Admin data must always be fresh — see app/admin/page.tsx for why this is
// `dynamic = "force-dynamic"` rather than the ISR the task's Part 2
// mentioned for the dashboard (a direct contradiction with its own
// "Important Notes" section, resolved in favor of "always fresh").
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pending Listings | ZProperty Admin" };

export default async function PendingListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { highlight } = await searchParams;
  const admin = createAdminClient();

  const { data } = await admin
    .from("listings")
    .select(
      `id, title, slug, purpose, rental_period, type, price,
       area_marla, beds, baths, description,
       primary_image_url, image_count, has_video,
       created_at, features, address, plot_number, agent_id,
       city:cities(name,slug),
       area:areas(name,slug),
       society:societies(name),
       phase:society_phases(name),
       block:society_blocks(name),
       agent:public_agent_contact(${AGENT_CONTACT_COLUMNS})`,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // Admins need agent name/CNIC-status/WhatsApp to actually make an
  // approve/reject call, so this is one of the few admin queries worth
  // paying for the same embed fallback the public listing pages use (see
  // lib/supabase/public.ts) — `agent_id` is added to the select above
  // specifically so the fallback has a key to join on.
  const listings = await backfillAgentContacts(admin, (data ?? []) as unknown as PendingListing[]);

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Pending Listings</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
          {listings.length} awaiting review
        </span>
      </div>

      <PendingListingsClient initialListings={listings} highlightId={highlight} />
    </div>
  );
}
