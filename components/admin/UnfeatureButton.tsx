"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unfeatureListingAction } from "@/app/admin/listings/actions";

export function UnfeatureButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);
    try {
      const result = await unfeatureListingAction(listingId);
      if (!result.ok) {
        setError(result.error ?? "Could not remove feature.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove feature.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handleClick()}
        className="text-xs font-semibold text-primary underline disabled:opacity-60"
      >
        {isPending ? "..." : "Remove feature"}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-black">⚠ {error}</p>}
    </span>
  );
}
