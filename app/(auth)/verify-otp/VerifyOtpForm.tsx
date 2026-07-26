"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { OTPInput } from "@/components/auth/OTPInput";
import { FormError } from "@/components/auth/FormError";
import { verifyOtpAction, resendOtpAction } from "../actions";

const RESEND_SECONDS = 30;

export function VerifyOtpForm({
  identifier,
  purpose,
}: {
  identifier: string;
  purpose: "login" | "signup";
}) {
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function submit(value: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await verifyOtpAction({ identifier, code: value, purpose });
      if (result?.error) setFormError(result.error);
    });
  }

  function handleResend() {
    setFormError(null);
    startTransition(async () => {
      const result = await resendOtpAction({ identifier, purpose });
      if (result?.error) {
        setFormError(result.error);
      } else {
        setSecondsLeft(RESEND_SECONDS);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <OTPInput
        disabled={isPending}
        onComplete={(value) => {
          setCode(value);
          submit(value);
        }}
      />

      <FormError message={formError} />

      <button
        type="button"
        onClick={() => submit(code)}
        disabled={isPending || code.length !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />}
        {isPending ? "Verifying..." : "Verify"}
      </button>

      <p className="text-[13px] text-primary-mid">
        {secondsLeft > 0 ? (
          <>Didn&apos;t receive it? Resend in 0:{secondsLeft.toString().padStart(2, "0")}</>
        ) : (
          <>
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isPending}
              className="font-medium text-primary hover:underline"
            >
              Resend code
            </button>
          </>
        )}
      </p>
    </div>
  );
}
