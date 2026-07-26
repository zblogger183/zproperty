"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { FormError } from "@/components/auth/FormError";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/components/auth/styles";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { requestPasswordResetAction } from "../actions";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);
      if ("error" in result) {
        setFormError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white">
          Reset link sent! Check your email.
        </div>
        <Link href="/login" className="text-center text-[13px] text-primary hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className={AUTH_LABEL_CLASS}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          className={AUTH_INPUT_CLASS}
          {...register("email")}
        />
        <FormError message={errors.email?.message} />
      </div>

      <FormError message={formError} />

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-mid disabled:opacity-70"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-secondary" aria-hidden="true" />}
        {isPending ? "Sending..." : "Send reset link"}
      </button>

      <Link href="/login" className="text-center text-[13px] text-primary-mid hover:text-primary">
        Back to log in
      </Link>
    </form>
  );
}
