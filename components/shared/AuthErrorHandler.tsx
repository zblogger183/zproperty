"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

// Supabase appends ?error=...&error_code=...&error_description=... to the
// redirectTo URL when an auth link (email confirmation, password reset)
// fails server-side before it ever reaches our app — e.g. an expired or
// already-used link. Since that failure happens on Supabase's own domain,
// it lands wherever the project's dashboard "Site URL" is configured,
// which is why this can surface on the homepage rather than the page the
// link was actually meant for.
export function AuthErrorHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  const errorDescription = searchParams.get("error_description");
  const errorCode = searchParams.get("error");

  useEffect(() => {
    if (!errorDescription && !errorCode) return;

    // Setting state from a URL param read on mount — not a derived-state
    // reset (no prior render to diff against), so this is the legitimate
    // fetch/read-on-mount case an effect exists for, same justification as
    // the other one-time-read effects in this codebase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage((errorDescription ?? errorCode ?? "").replace(/\+/g, " "));

    // Strip the error params from the URL without a full navigation/reload,
    // via the Next.js router (not raw history.replaceState) so its client
    // search-param cache doesn't go stale relative to the address bar.
    router.replace(pathname, { scroll: false });
    // Only ever meant to run once, right after the redirect lands — re-running
    // on every pathname/router identity change would re-trigger the replace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!message) return null;

  return (
    <div className="sticky top-14 z-40 flex items-center gap-3 border-b border-primary bg-white px-4 py-3 shadow-sm">
      <p className="flex-1 text-sm text-black">{message}</p>
      <button
        type="button"
        onClick={() => setMessage(null)}
        aria-label="Dismiss"
        className="shrink-0 text-primary hover:text-primary-mid"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
