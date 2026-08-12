"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveListingAction, unsaveListingAction } from "@/app/buyer/actions";

// `initialSaved` is best-effort: pages that already know the signed-in
// buyer's saved-listing set (currently just the listing detail page) pass
// the real value; grid contexts (home, search results, similar-properties)
// default to false rather than joining saved_listings into every card
// query. The button still saves/unsaves correctly either way — a listing
// that's already saved just won't show a filled heart on first paint in
// those grids.
export function SaveButton({
  listingId,
  initialSaved = false,
  variant = "icon",
  className,
}: {
  listingId: string;
  initialSaved?: boolean;
  variant?: "icon" | "labeled";
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const next = !saved;
    setSaved(next); // optimistic

    startTransition(async () => {
      try {
        await (next ? saveListingAction(listingId) : unsaveListingAction(listingId));
      } catch {
        setSaved(!next); // revert
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      }
    });
  }

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-bold transition disabled:opacity-60",
          saved ? "bg-primary text-white" : "bg-white text-primary hover:bg-primary/5",
          className,
        )}
      >
        <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved listings" : "Save listing"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow transition hover:bg-white disabled:opacity-60",
        className,
      )}
    >
      <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
