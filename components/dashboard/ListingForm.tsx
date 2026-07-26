"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const listingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price: z.coerce.number().positive("Price must be positive"),
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
});

type ListingFormInput = z.input<typeof listingFormSchema>;
export type ListingFormValues = z.output<typeof listingFormSchema>;

export function ListingForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<ListingFormInput>;
  onSubmit: (values: ListingFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ListingFormInput, unknown, ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-text">
        Title
        <input {...register("title")} className="rounded-md border border-secondary bg-bg px-3 py-2" />
        {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        Price
        <input
          type="number"
          {...register("price")}
          className="rounded-md border border-secondary bg-bg px-3 py-2"
        />
        {errors.price && <span className="text-xs text-red-500">{errors.price.message}</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        City
        <input {...register("city")} className="rounded-md border border-secondary bg-bg px-3 py-2" />
        {errors.city && <span className="text-xs text-red-500">{errors.city.message}</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        Area
        <input {...register("area")} className="rounded-md border border-secondary bg-bg px-3 py-2" />
        {errors.area && <span className="text-xs text-red-500">{errors.area.message}</span>}
      </label>
      <button type="submit" className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-bg">
        Save Listing
      </button>
    </form>
  );
}
