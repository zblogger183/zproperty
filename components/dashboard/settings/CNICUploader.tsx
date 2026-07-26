"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export function CNICUploader({
  label,
  side,
  currentPath,
  onUploaded,
}: {
  label: string;
  side: "front" | "back";
  currentPath: string | null;
  onUploaded: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("side", side);

      const response = await fetch("/api/upload/cnic", { method: "POST", body: formData });
      const result = (await response.json()) as { path?: string; error?: string };

      if (!response.ok || !result.path) {
        throw new Error(result.error ?? "Upload failed.");
      }
      onUploaded(result.path);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center ${
          isDragOver ? "border-secondary" : "border-primary"
        }`}
      >
        {currentPath ? (
          <div>
            <p className="rounded-lg bg-secondary p-3 text-sm font-semibold text-primary">✓ Image uploaded</p>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="mt-2 cursor-pointer text-xs text-primary-mid underline disabled:opacity-60"
            >
              {isUploading ? "Uploading..." : "Re-upload"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="w-full cursor-pointer disabled:opacity-60"
          >
            <Upload className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-black">
              {isUploading ? "Uploading..." : `Click to upload ${label}`}
            </p>
            <p className="text-xs text-primary-mid">JPG or PNG, max 5MB</p>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  );
}
