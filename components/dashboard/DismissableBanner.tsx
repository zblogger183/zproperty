"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export function DismissableBanner({
  param,
  value,
  message,
  storageKey,
}: {
  param: string;
  value: string;
  message: string;
  storageKey: string;
}) {
  const searchParams = useSearchParams();
  const matches = searchParams.get(param) === value;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (matches && sessionStorage.getItem(storageKey) === "1") {
      // sessionStorage only exists client-side and can't be read during
      // render (SSR has no access to it, and reading it there would desync
      // from the server-rendered HTML) — this has to happen post-mount in
      // an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(true);
    }
  }, [matches, storageKey]);

  if (!matches || dismissed) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 font-semibold text-primary">
      <span className="flex-1 text-sm">{message}</span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(storageKey, "1");
          setDismissed(true);
        }}
        aria-label="Dismiss"
        className="shrink-0 text-primary"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
