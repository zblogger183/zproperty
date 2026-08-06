"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveListingAction, deactivateListingAction, rejectListingAction } from "@/app/admin/listings/actions";
import { inputClass } from "./styles";

const REJECT_REASONS = [
  "Incorrect/misleading price",
  "Incomplete information",
  "Poor quality or no photos",
  "Duplicate listing",
  "Incorrect property type",
  "Prohibited content",
  "Other (add note below)",
];

export function ListingStatusActions({ listingId, status }: { listingId: string; status: string }) {
  const router = useRouter();
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [note, setNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setIsPending(true);
    setError(null);
    try {
      await action();
      router.refresh();
      setIsRejecting(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-3">
        {status === "pending" && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsRejecting((value) => !value)}
              className="rounded-lg border border-primary bg-white px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-60"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => void run(() => approveListingAction(listingId))}
              className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-60"
            >
              {isPending ? "..." : "Approve"}
            </button>
          </>
        )}

        {status === "active" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => void run(() => deactivateListingAction(listingId, "paused"))}
            className="rounded-lg border border-primary px-4 py-2 text-sm text-primary transition hover:bg-primary hover:text-white disabled:opacity-60"
          >
            {isPending ? "..." : "Pause Listing"}
          </button>
        )}

        {status === "paused" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => void run(() => approveListingAction(listingId))}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-60"
          >
            {isPending ? "..." : "Reactivate"}
          </button>
        )}
      </div>

      {error && <p className="max-w-xs text-right text-xs font-medium text-black">⚠ {error}</p>}

      {isRejecting && (
        <div className="mt-2 w-80 rounded-xl border border-primary bg-white p-4 text-left">
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
          <div className="mt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRejecting(false)}
              className="rounded-lg border border-primary bg-white px-4 py-2 text-sm text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => void run(() => rejectListingAction(listingId, reason, note || undefined))}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
