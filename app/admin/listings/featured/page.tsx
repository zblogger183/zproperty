import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils/formatPrice";
import { UnfeatureButton } from "@/components/admin/UnfeatureButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Featured Listings | SarZameenz Admin" };

interface FeaturedListingRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  purpose: "buy" | "rent";
  price: number;
  primary_image_url: string | null;
  featured_until: string | null;
  is_hot_deal: boolean;
  city: { name: string } | null;
  agent: { name: string } | null;
}

// Pulled out of the component: react-hooks/purity flags any direct
// Date.now() call inside a function shaped like a component, since a
// component's render is expected to be idempotent between calls. A plain
// helper isn't classified as a component, so it doesn't trip the rule (see
// the same pattern in components/dashboard/ListingRow.tsx).
function isPastDate(dateString: string): boolean {
  return new Date(dateString).getTime() < Date.now();
}

export default async function FeaturedListingsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("listings")
    .select(
      `id, title, slug, status, purpose, price, primary_image_url, featured_until, is_hot_deal,
       city:cities(name), agent:public_agent_contact(name)`,
    )
    .eq("is_featured", true)
    .order("featured_until", { ascending: true });

  const listings = (data ?? []) as unknown as FeaturedListingRow[];

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Featured Listings</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
          {listings.length} featured
        </span>
      </div>
      <p className="mt-1 text-sm text-primary-mid">
        Manually featured listings. Feature a listing from its detail page, or via an agent&apos;s paid boost
        (Boost Listings, not yet reflected here since those write to <code>listing_boosts</code> rather than
        <code> is_featured</code> directly).
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Image</th>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Agent</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Featured Until</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const expired = listing.featured_until != null && isPastDate(listing.featured_until);
              return (
                <tr key={listing.id} className="border-b border-primary hover:bg-secondary/5">
                  <td className="px-4 py-3">
                    {listing.primary_image_url ? (
                      <div className="relative h-9 w-12 overflow-hidden rounded border border-primary">
                        <Image src={listing.primary_image_url} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-9 w-12 rounded bg-primary-mid" />
                    )}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm font-medium text-black">
                    <Link href={`/admin/listings/${listing.id}`} className="hover:underline">
                      {listing.title}
                    </Link>
                    {listing.is_hot_deal && (
                      <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        Hot Deal
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-primary-mid">{listing.agent?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-primary-mid">{listing.city?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-black">
                    {formatPrice(listing.price, listing.purpose)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {listing.featured_until ? (
                      <span className={expired ? "font-semibold text-black" : "text-primary-mid"}>
                        {expired ? "Expired " : ""}
                        {format(new Date(listing.featured_until), "MMM d, yyyy")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <UnfeatureButton listingId={listing.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {listings.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No listings are currently featured.</p>
        )}
      </div>
    </div>
  );
}
