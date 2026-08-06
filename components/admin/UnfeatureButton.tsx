"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unfeatureListingAction } from "@/app/admin/listings/actions";

export function UnfeatureButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      await unfeatureListingAction(listingId);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => void handleClick()}
      className="text-xs font-semibold text-primary underline disabled:opacity-60"
    >
      {isPending ? "..." : "Remove feature"}
    </button>
  );
}
