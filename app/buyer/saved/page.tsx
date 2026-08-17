import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SavedListingCard, type SavedListingData } from "@/components/buyer/SavedListingCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Saved Listings | ZProperty" };

interface SavedRow {
  listing: SavedListingData | null;
}

export default async function SavedListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("saved_listings")
    .select("listing:listings(id, slug, title, purpose, price, primary_image_url, city:cities(name), area:areas(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listings = ((data ?? []) as unknown as SavedRow[]).map((row) => row.listing).filter((l): l is SavedListingData => l != null);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Saved Listings</h1>
      <p className="mt-1 text-sm text-primary-mid">Properties you&apos;ve bookmarked.</p>

      <div className="mt-6 flex flex-col gap-3">
        {listings.map((listing) => (
          <SavedListingCard key={listing.id} listing={listing} />
        ))}

        {listings.length === 0 && (
          <div className="rounded-xl border border-primary bg-white p-10 text-center">
            <p className="text-sm text-primary-mid">You haven&apos;t saved any listings yet.</p>
            <Link href="/buy/lahore" className="mt-3 inline-block text-sm font-semibold text-primary underline">
              Browse listings →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
