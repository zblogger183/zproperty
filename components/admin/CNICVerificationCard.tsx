"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { formatCnic } from "@/lib/utils";
import { approveCNICAction, rejectCNICAction } from "@/app/admin/users/actions";
import { inputClass } from "@/components/admin/styles";

export interface CNICVerificationAgent {
  user_id: string;
  cnic_number: string;
  updated_at: string;
  subscription_tier: string;
  name: string;
  email: string;
  front_url: string | null;
  back_url: string | null;
}

export function CNICVerificationCard({
  agent,
  onAction,
}: {
  agent: CNICVerificationAgent;
  onAction: () => void;
}) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setIsPending(true);
    setError(null);
    try {
      await approveCNICAction(agent.user_id);
      onAction();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Failed to approve.");
      setIsPending(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      await rejectCNICAction(agent.user_id, reason.trim());
      onAction();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Failed to reject.");
      setIsPending(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-primary bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold text-black">{agent.name}</p>
          <p className="text-xs text-primary-mid">{agent.email}</p>
          <p className="mt-1 font-mono text-sm text-black">{formatCnic(agent.cnic_number)}</p>
          <p className="text-xs text-primary-mid">
            Submitted {formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}
          </p>
          <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-bold capitalize text-secondary">
            {agent.subscription_tier}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs text-white">Pending Review</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {(["front", "back"] as const).map((side) => {
          const url = side === "front" ? agent.front_url : agent.back_url;
          return (
            <div key={side}>
              <p className="mb-1 text-xs font-semibold text-black capitalize">{side}</p>
              {url ? (
                <>
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-primary">
                    <Image src={url} alt={`CNIC ${side}`} fill className="object-contain" />
                  </div>
                  <a href={url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-primary underline">
                    Open full size
                  </a>
                </>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-primary-mid text-xs text-white">
                  Not uploaded
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-primary-mid">Images expire after 10 minutes. Refresh page if needed.</p>

      {error && (
        <p className="mt-3 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      <div className="mt-4 border-t border-primary pt-4">
        {isRejecting ? (
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for rejection"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              disabled={isPending || !reason.trim()}
              onClick={() => void handleReject()}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Confirm Reject
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRejecting(false);
                setReason("");
              }}
              className="text-sm text-primary-mid"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsRejecting(true)}
              className="rounded-lg border border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary disabled:opacity-60"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => void handleApprove()}
              className="rounded-lg bg-secondary px-8 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark disabled:opacity-60"
            >
              Approve CNIC
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
