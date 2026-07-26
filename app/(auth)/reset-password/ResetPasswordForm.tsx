"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormError } from "@/components/auth/FormError";
import { AUTH_LABEL_CLASS } from "@/components/auth/styles";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";
import { updatePasswordAction } from "../actions";

export function ResetPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await updatePasswordAction(values);
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="password" className={AUTH_LABEL_CLASS}>
          New password
        </label>
        <PasswordInput id="password" placeholder="••••••••" {...register("password")} />
        <FormError message={errors.password?.message} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={AUTH_LABEL_CLASS}>
          Confirm new password
        </label>
        <PasswordInput id="confirmPassword" placeholder="••••••••" {...register("confirmPassword")} />
        <FormError message={errors.confirmPassword?.message} />
      </div>

      <FormError message={formError} />

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-70"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />}
        {isPending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
