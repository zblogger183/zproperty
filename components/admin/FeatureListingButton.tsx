"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { featureListingAction } from "@/app/admin/listings/actions";

export function FeatureListingButton({ listingId, isFeatured }: { listingId: string; isFeatured: boolean }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);
    try {
      const result = await featureListingAction(listingId);
      if (!result.ok) {
        setError(result.error ?? "Could not feature listing.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not feature listing.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending || isFeatured}
        onClick={() => void handleClick()}
        className="w-full rounded-lg bg-secondary py-2 text-sm font-bold text-primary disabled:opacity-60"
      >
        {isPending ? "..." : isFeatured ? "✓ Featured" : "Feature this listing"}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-black">⚠ {error}</p>}
    </div>
  );
}
