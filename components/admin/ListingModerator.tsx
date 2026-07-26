"use client";

export function ListingModerator({
  listingId,
  onApprove,
  onReject,
}: {
  listingId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onApprove(listingId)}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-bg"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => onReject(listingId)}
        className="rounded-md border border-secondary px-3 py-1.5 text-sm font-medium text-text"
      >
        Reject
      </button>
    </div>
  );
}
