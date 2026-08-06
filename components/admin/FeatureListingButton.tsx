"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { featureListingAction } from "@/app/admin/listings/actions";

export function FeatureListingButton({ listingId, isFeatured }: { listingId: string; isFeatured: boolean }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      await featureListingAction(listingId);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isPending || isFeatured}
      onClick={() => void handleClick()}
      className="w-full rounded-lg bg-secondary py-2 text-sm font-bold text-primary disabled:opacity-60"
    >
      {isPending ? "..." : isFeatured ? "✓ Featured" : "Feature this listing"}
    </button>
  );
}
