"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { unsaveListingAction } from "@/app/buyer/actions";
import { formatPrice } from "@/lib/utils/formatPrice";

export interface SavedListingData {
  id: string;
  slug: string;
  title: string;
  purpose: "buy" | "rent";
  price: number;
  primary_image_url: string | null;
  city: { name: string } | null;
  area: { name: string } | null;
}

export function SavedListingCard({ listing }: { listing: SavedListingData }) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleUnsave() {
    setIsRemoving(true);
    try {
      await unsaveListingAction(listing.id);
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  const location = [listing.area?.name, listing.city?.name].filter(Boolean).join(", ");

  return (
    <div className="flex gap-4 rounded-xl border border-primary bg-white p-4">
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-primary">
        {listing.primary_image_url ? (
          <Image src={listing.primary_image_url} alt="" fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-mid text-[10px] text-white">
            No image
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/listing/${listing.slug}`} className="line-clamp-1 text-sm font-semibold text-black hover:underline">
          {listing.title}
        </Link>
        {location && <p className="mt-0.5 text-xs text-primary-mid">{location}</p>}
        <p className="mt-1 text-sm font-bold text-black">{formatPrice(listing.price, listing.purpose)}</p>
      </div>
      <button
        type="button"
        disabled={isRemoving}
        onClick={() => void handleUnsave()}
        className="shrink-0 self-start text-xs font-semibold text-primary underline disabled:opacity-60"
      >
        {isRemoving ? "..." : "Remove"}
      </button>
    </div>
  );
}
