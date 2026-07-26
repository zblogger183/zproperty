"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { formatPrice } from "@/lib/utils/formatPrice";
import { approveListingAction, rejectListingAction } from "@/app/admin/listings/actions";
import { inputClass } from "./styles";

export interface PendingListing {
  id: string;
  title: string;
  slug: string;
  purpose: "buy" | "rent";
  type: string;
  price: number;
  area_marla: number | null;
  beds: number | null;
  baths: number | null;
  description: string | null;
  primary_image_url: string | null;
  image_count: number;
  has_video: boolean;
  created_at: string;
  address: string | null;
  agent_id: string | null;
  city: { name: string; slug: string } | null;
  area: { name: string; slug: string } | null;
  society: { name: string } | null;
  agent: {
    name: string;
    whatsapp: string | null;
    profile_slug: string;
    cnic_verified: boolean;
    subscription_tier: string;
  } | null;
}

const REJECT_REASONS = [
  "Incorrect/misleading price",
  "Incomplete information",
  "Poor quality or no photos",
  "Duplicate listing",
  "Incorrect property type",
  "Prohibited content",
  "Other (add note below)",
];

export function PendingListingCard({
  listing,
  onAction,
}: {
  listing: PendingListing;
  onAction: () => void;
}) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const location = [listing.society?.name, listing.area?.name, listing.city?.name]
    .filter(Boolean)
    .join(", ");
  const cleanedWhatsapp = listing.agent?.whatsapp?.replace(/\D/g, "");
  const descriptionPreview = listing.description?.slice(0, 200) ?? "";

  async function handleApprove() {
    setIsSubmitting(true);
    setError(null);
    try {
      await approveListingAction(listing.id);
      onAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve listing.");
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    setIsSubmitting(true);
    setError(null);
    try {
      await rejectListingAction(listing.id, reason, note || undefined);
      onAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject listing.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-primary bg-white">
      <div className="flex items-center gap-3 bg-primary px-5 py-3">
        <span className="flex-1 truncate text-sm font-semibold text-white">{listing.title}</span>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-primary">
          {listing.purpose === "buy" ? "Buy" : "Rent"}
        </span>
        <span className="shrink-0 text-xs capitalize text-primary-mid">
          {listing.type.replace(/_/g, " ")}
        </span>
        <span className="ml-auto shrink-0 text-xs text-primary-mid">
          Submitted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
        </span>
      </div>

      <div className="flex gap-4 p-5">
        {listing.primary_image_url ? (
          <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-primary">
            <Image src={listing.primary_image_url} alt="" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-primary-mid text-xs text-white">
            No photos
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-black">{formatPrice(listing.price, listing.purpose)}</p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-primary-mid">
            {listing.beds != null && <span>{listing.beds} Beds</span>}
            {listing.baths != null && <span>{listing.baths} Baths</span>}
            {listing.area_marla != null && <span>{listing.area_marla} Marla</span>}
            <span>{listing.image_count} Photos</span>
            {listing.has_video && <span>Video ✓</span>}
          </div>
          {location && <p className="mt-1 text-xs text-primary-mid">{location}</p>}
          {descriptionPreview && (
            <p className="mt-2 line-clamp-2 text-xs text-black">{descriptionPreview}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-black">{listing.agent?.name ?? "—"}</p>
          {listing.agent?.cnic_verified && (
            <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-secondary">
              ✓ CNIC
            </span>
          )}
          {listing.agent?.subscription_tier && (
            <span className="mt-1 block w-fit rounded-full border border-primary px-2 py-0.5 text-[10px] capitalize text-primary ml-auto">
              {listing.agent.subscription_tier}
            </span>
          )}
          {cleanedWhatsapp && (
            <a
              href={`https://wa.me/${cleanedWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-xs text-primary-mid underline"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-primary bg-white px-5 py-3">
        <Link
          href={`/listing/${listing.slug}`}
          target="_blank"
          className="text-sm text-primary underline hover:text-primary-mid"
        >
          View Full Listing →
        </Link>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setIsRejecting((value) => !value)}
          disabled={isSubmitting}
          className="rounded-lg border border-primary bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-60"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={isSubmitting}
          className="rounded-lg bg-secondary px-6 py-2 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-60"
        >
          {isSubmitting ? "..." : "Approve"}
        </button>
      </div>

      {error && (
        <p className="border-t border-primary px-5 py-2 text-xs font-medium text-black">⚠ {error}</p>
      )}

      {isRejecting && (
        <div className="border-t border-primary bg-white px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-black">Reason for rejection (required):</p>
          <select value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass}>
            {REJECT_REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Additional notes to agent..."
            className={`${inputClass} mt-2`}
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setIsRejecting(false)}
              className="rounded-lg border border-primary bg-white px-4 py-2 text-sm text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSubmitting ? "..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
