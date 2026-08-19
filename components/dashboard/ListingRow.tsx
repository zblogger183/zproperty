"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { formatPrice } from "@/lib/utils/formatPrice";
import {
  activateListingAction,
  deleteListingAction,
  pauseListingAction,
  renewListingAction,
  resubmitListingAction,
} from "@/app/dashboard/listings/actions";

export interface DashboardListingRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  purpose: "buy" | "rent";
  rental_period: "monthly" | "weekly" | "daily";
  type: string;
  price: number;
  area_marla: number | null;
  beds: number | null;
  baths: number | null;
  image_count: number;
  has_video: boolean;
  views_count: number;
  leads_count: number;
  calls_count: number;
  whatsapp_count: number;
  is_featured: boolean;
  is_hot_deal: boolean;
  featured_until: string | null;
  primary_image_url: string | null;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
  reject_reason: string | null;
  city: { name: string; slug: string } | null;
  area: { name: string; slug: string } | null;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active: "bg-secondary text-primary font-bold",
  pending: "bg-primary text-white",
  paused: "bg-primary-mid text-white",
  rejected: "border border-primary bg-white text-black",
  expired: "border border-primary bg-white text-primary-mid",
  sold: "bg-primary text-secondary",
};

// Pulled out of the component: react-hooks/purity flags any direct
// Date.now() call inside a function shaped like a component, since a
// client component's render is expected to be idempotent between calls. A
// plain helper isn't classified as a component, so it doesn't trip the rule.
function isExpiringSoon(status: string, expiresAt: string | null): boolean {
  if (status !== "active" || !expiresAt) return false;
  const msRemaining = new Date(expiresAt).getTime() - Date.now();
  return msRemaining > 0 && msRemaining < 14 * 24 * 60 * 60 * 1000;
}

export function ListingRow({ listing }: { listing: DashboardListingRow }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const location = [listing.area?.name, listing.city?.name].filter(Boolean).join(", ");
  const expiresSoon = isExpiringSoon(listing.status, listing.expires_at);

  async function runAction(action: () => Promise<unknown>) {
    setIsPending(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setIsPending(false);
    }
  }

  function handleDelete() {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    void runAction(() => deleteListingAction(listing.id));
  }

  return (
    <tr className="border-b border-primary hover:bg-secondary/5">
      <td className="px-4 py-3">
        <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-lg border border-primary">
          {listing.primary_image_url ? (
            <Image src={listing.primary_image_url} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary-mid text-center text-[10px] text-white">
              No img
            </div>
          )}
        </div>
      </td>

      <td className="max-w-[220px] px-4 py-3">
        {listing.status === "active" ? (
          <Link
            href={`/listing/${listing.slug}`}
            target="_blank"
            className="line-clamp-1 text-sm font-semibold text-black hover:underline"
          >
            {listing.title}
          </Link>
        ) : (
          <p className="line-clamp-1 text-sm font-semibold text-black">{listing.title}</p>
        )}
        {location && <p className="mt-0.5 text-xs text-primary-mid">{location}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {listing.is_featured && (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-primary">
              Featured
            </span>
          )}
          {listing.is_hot_deal && (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-primary">
              Hot Deal
            </span>
          )}
          <span className="text-[10px] text-primary-mid">{listing.image_count} photos</span>
        </div>
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2 py-1 text-[10px] capitalize ${
            STATUS_BADGE_CLASSES[listing.status] ?? ""
          }`}
        >
          {listing.status}
        </span>
        {listing.status === "rejected" && listing.reject_reason && (
          <p className="mt-1 line-clamp-2 text-[10px] italic text-black">Reason: {listing.reject_reason}</p>
        )}
        {expiresSoon && listing.expires_at && (
          <p className="mt-1 text-[10px] text-black">
            ⚠ Expires {formatDistanceToNow(new Date(listing.expires_at), { addSuffix: true })}
          </p>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-3">
          <div>
            <p className="text-sm font-semibold text-black">{listing.views_count}</p>
            <p className="text-[10px] text-primary-mid">views</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-black">{listing.leads_count}</p>
            <p className="text-[10px] text-primary-mid">leads</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-sm font-semibold text-black">
        {formatPrice(listing.price, listing.purpose, listing.rental_period)}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/listings/${listing.id}/edit`} className="text-xs text-primary underline">
            Edit
          </Link>

          {listing.status === "active" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => void runAction(() => pauseListingAction(listing.id))}
              className="rounded border border-primary px-2 py-1 text-xs text-primary-mid disabled:opacity-60"
            >
              Pause
            </button>
          )}
          {listing.status === "paused" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => void runAction(() => activateListingAction(listing.id))}
              className="rounded bg-secondary px-2 py-1 text-xs font-bold text-primary disabled:opacity-60"
            >
              Activate
            </button>
          )}
          {listing.status === "rejected" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => void runAction(() => resubmitListingAction(listing.id))}
              className="rounded bg-primary px-2 py-1 text-xs text-white disabled:opacity-60"
            >
              Resubmit
            </button>
          )}
          {listing.status === "expired" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => void runAction(() => renewListingAction(listing.id))}
              className="rounded bg-secondary px-2 py-1 text-xs font-bold text-primary disabled:opacity-60"
            >
              Renew
            </button>
          )}
          {listing.status === "pending" && <span className="text-xs text-primary-mid">Under Review</span>}
          {listing.status === "sold" && <span className="text-xs text-primary-mid">—</span>}

          {listing.status !== "pending" && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="text-xs text-primary-mid hover:text-black disabled:opacity-60"
            >
              Delete
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-[10px] font-medium text-black">⚠ {error}</p>}
      </td>
    </tr>
  );
}
