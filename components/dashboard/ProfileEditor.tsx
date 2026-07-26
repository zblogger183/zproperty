"use client";

import { useForm } from "react-hook-form";

export interface ProfileFormValues {
  fullName: string;
  phone: string;
  bio: string;
}

export function ProfileEditor({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<ProfileFormValues>;
  onSubmit: (values: ProfileFormValues) => void;
}) {
  const { register, handleSubmit } = useForm<ProfileFormValues>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-text">
        Full name
        <input {...register("fullName")} className="rounded-md border border-secondary bg-bg px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        Phone
        <input {...register("phone")} className="rounded-md border border-secondary bg-bg px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        Bio
        <textarea {...register("bio")} rows={4} className="rounded-md border border-secondary bg-bg px-3 py-2" />
      </label>
      <button type="submit" className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-bg">
        Save Profile
      </button>
    </form>
  );
}
