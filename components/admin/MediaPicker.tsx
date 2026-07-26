"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";

interface UploadApiResult {
  large_url?: string;
  error?: string;
}

export function MediaPicker({
  value,
  onChange,
  folder,
}: {
  value: string | null;
  onChange: (url: string) => void;
  folder: "blog" | "general" | "projects";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload/image", { method: "POST", body: formData });
      const result: UploadApiResult = await response.json();

      if (!response.ok || !result.large_url) {
        throw new Error(result.error ?? "Upload failed.");
      }

      onChange(result.large_url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />

      {value ? (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-primary">
            <Image src={value} alt="" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Change image"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-lg border border-dashed border-primary p-4 text-center transition hover:border-secondary disabled:opacity-60"
        >
          <ImagePlus className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
          <p className="mt-2 text-sm text-primary-mid">
            {uploading ? "Uploading..." : "Click to upload cover image"}
          </p>
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  );
}
