"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  activateUserAction,
  adminOverridePlanAction,
  approveCNICAction,
  suspendUserAction,
} from "@/app/admin/users/actions";

const PLAN_OPTIONS = ["free", "pro", "elite"];

export function AgentAdminActions({
  userId,
  isActive,
  cnicVerified,
  currentPlan,
}: {
  userId: string;
  isActive: boolean;
  cnicVerified: boolean;
  currentPlan: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
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

  return (
    <div className="rounded-xl border border-primary bg-white p-5">
      <h2 className="mb-4 text-base font-bold text-black">Admin Actions</h2>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => void run(() => (isActive ? suspendUserAction(userId) : activateUserAction(userId)))}
          className="rounded-lg border border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary disabled:opacity-60"
        >
          {isActive ? "Suspend Agent" : "Activate Agent"}
        </button>

        {!cnicVerified && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => void run(() => approveCNICAction(userId))}
            className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
          >
            Verify CNIC Manually
          </button>
        )}

        <label className="flex items-center gap-2 text-sm text-black">
          Change Plan
          <select
            defaultValue={currentPlan}
            disabled={isPending}
            onChange={(event) => void run(() => adminOverridePlanAction(userId, event.target.value))}
            className="rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black"
          >
            {PLAN_OPTIONS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  );
}
