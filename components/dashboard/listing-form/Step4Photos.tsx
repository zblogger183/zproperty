"use client";

import { ImageUploader } from "@/components/dashboard/ImageUploader";
import type { Step4Data } from "@/app/dashboard/listings/schemas";
import { errorClass } from "./styles";

export function Step4Photos({
  data,
  errors,
  onChange,
}: {
  data: Partial<Step4Data>;
  errors: Record<string, string>;
  onChange: (data: Partial<Step4Data>) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm text-primary-mid">Upload at least 3 photos for better visibility</p>
      <p className="mb-4 text-xs text-primary-mid">First photo will be the main listing photo</p>

      <ImageUploader
        maxFiles={20}
        existingImages={data.images}
        onUploaded={(images) => onChange({ images })}
      />

      {errors.images && <p className={errorClass}>⚠ {errors.images}</p>}
    </div>
  );
}
