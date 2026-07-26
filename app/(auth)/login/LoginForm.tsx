"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormError } from "@/components/auth/FormError";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/components/auth/styles";
import { loginSchema, otpIdentifierSchema, type LoginInput } from "../schemas";
import { loginWithPasswordAction, sendLoginOtpAction, signInWithGoogleAction } from "../actions";

type Mode = "password" | "otp";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  function onSubmitPassword(values: LoginInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await loginWithPasswordAction(values);
      if (result?.error) setFormError(result.error);
    });
  }

  async function onSendOtp() {
    setFormError(null);
    const identifier = getValues("identifier");
    const parsed = otpIdentifierSchema.safeParse({ identifier });

    if (!parsed.success) {
      await trigger("identifier");
      return;
    }

    startTransition(async () => {
      const result = await sendLoginOtpAction({ identifier });
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={mode === "password" ? handleSubmit(onSubmitPassword) : (event) => event.preventDefault()}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="identifier" className={AUTH_LABEL_CLASS}>
            Email or phone
          </label>
          <input
            id="identifier"
            placeholder="Email or phone number"
            className={AUTH_INPUT_CLASS}
            {...register("identifier")}
          />
          <FormError message={errors.identifier?.message} />
        </div>

        {mode === "password" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-semibold text-black">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-primary-mid hover:text-primary">
                Forgot password?
              </Link>
            </div>
            <PasswordInput id="password" placeholder="••••••••" {...register("password")} />
            <FormError message={errors.password?.message} />
          </div>
        )}

        <FormError message={formError} />

        {mode === "password" ? (
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-mid disabled:opacity-70"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-secondary" aria-hidden="true" />}
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSendOtp}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-mid disabled:opacity-70"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-secondary" aria-hidden="true" />}
            {isPending ? "Sending..." : "Send OTP"}
          </button>
        )}
      </form>

      <button
        type="button"
        onClick={() => {
          setFormError(null);
          setMode((current) => (current === "password" ? "otp" : "password"));
        }}
        className="text-center text-[13px] text-primary-mid hover:text-primary"
      >
        {mode === "password" ? "Sign in with OTP instead" : "Sign in with password instead"}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-primary/30" />
        <span className="text-xs text-primary-mid">or</span>
        <span className="h-px flex-1 bg-primary/30" />
      </div>

      <form action={signInWithGoogleAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary bg-white px-4 py-2.5 text-sm text-black transition hover:border-primary-mid"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </form>

      <p className="text-center text-[13px] text-black">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.27-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}
