"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { verifyBankTransferAction } from "@/app/admin/payments/actions";
import { inputClass } from "@/components/admin/styles";

export interface BankTransferTransaction {
  id: string;
  amount: number;
  bank_slip_url: string | null;
  initiated_at: string;
  user: { name: string; email: string } | null;
}

export function BankTransferQueue({ transactions }: { transactions: BankTransferTransaction[] }) {
  const [items, setItems] = useState(transactions);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setProcessingId(id);
    setError(null);

    try {
      await verifyBankTransferAction(id, true);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Failed to approve transfer.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    setError(null);

    try {
      await verifyBankTransferAction(id, false, reason.trim() || undefined);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRejectingId(null);
      setReason("");
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Failed to reject transfer.");
    } finally {
      setProcessingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-primary-mid">No pending bank transfers.</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      {items.map((txn) => (
        <div key={txn.id} className="rounded-xl border border-primary bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-bold text-black">{txn.user?.name ?? "Unknown user"}</p>
              <p className="text-lg font-semibold text-primary">PKR {txn.amount.toLocaleString("en-PK")}</p>
              <p className="text-xs text-primary-mid">
                {formatDistanceToNow(new Date(txn.initiated_at), { addSuffix: true })} ago
              </p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
              Pending Verification
            </span>
          </div>

          <div className="mt-4">
            {txn.bank_slip_url ? (
              <Image
                src={txn.bank_slip_url}
                alt="Payment slip"
                width={400}
                height={280}
                className="rounded-xl border border-primary object-contain"
              />
            ) : (
              <p className="text-sm text-primary-mid">No slip uploaded</p>
            )}
          </div>

          {rejectingId === txn.id ? (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-primary-mid" htmlFor={`reason-${txn.id}`}>
                Reason for rejection
              </label>
              <input
                id={`reason-${txn.id}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className={`${inputClass} mt-1`}
              />
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(null);
                    setReason("");
                  }}
                  className="rounded-lg border border-primary bg-white px-6 py-2.5 text-sm font-semibold text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processingId === txn.id}
                  onClick={() => void handleReject(txn.id)}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {processingId === txn.id ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={processingId === txn.id}
                onClick={() => setRejectingId(txn.id)}
                className="rounded-lg border border-primary bg-white px-6 py-2.5 text-sm font-semibold text-primary disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={processingId === txn.id}
                onClick={() => void handleApprove(txn.id)}
                className="rounded-lg bg-secondary px-8 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark disabled:opacity-60"
              >
                {processingId === txn.id ? "Approving..." : "Approve"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
