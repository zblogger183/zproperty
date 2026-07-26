"use client";

import { useState } from "react";
import { PendingListingCard, type PendingListing } from "./PendingListingCard";

export function PendingListingsClient({
  initialListings,
  highlightId,
}: {
  initialListings: PendingListing[];
  highlightId?: string;
}) {
  const [listings, setListings] = useState(initialListings);

  function removeListing(id: string) {
    setListings((prev) => prev.filter((listing) => listing.id !== id));
  }

  if (listings.length === 0) {
    return (
      <p className="py-20 text-center text-base text-primary-mid">
        All caught up! No listings pending.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {listings.map((listing) => (
        <div key={listing.id} className={listing.id === highlightId ? "rounded-xl ring-2 ring-secondary" : ""}>
          <PendingListingCard listing={listing} onAction={() => removeListing(listing.id)} />
        </div>
      ))}
    </div>
  );
}
