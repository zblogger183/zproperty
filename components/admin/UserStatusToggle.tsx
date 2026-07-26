"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateUserAction, suspendUserAction } from "@/app/admin/users/actions";

export function UserStatusToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      if (isActive) await suspendUserAction(userId);
      else await activateUserAction(userId);
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
      className="rounded border border-primary px-2 py-1 text-xs text-primary-mid hover:bg-primary hover:text-white disabled:opacity-60"
    >
      {isPending ? "..." : isActive ? "Suspend" : "Activate"}
    </button>
  );
}
