"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { UploadCloud } from "lucide-react";
import type { UploadedImage } from "@/types";

interface UploadApiResult {
  id?: string;
  thumb_url?: string;
  medium_url?: string;
  large_url?: string;
  og_url?: string;
  compression_pct?: number;
  original_size_kb?: number;
  error?: string;
}

export function ImageUploader({
  listingId,
  folder = "listings",
  onUploaded,
  maxFiles = 20,
  existingImages,
}: {
  listingId?: string;
  folder?: string;
  onUploaded: (images: UploadedImage[]) => void;
  maxFiles?: number;
  existingImages?: UploadedImage[];
}) {
  const [images, setImages] = useState<UploadedImage[]>(() => existingImages ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadIndex, setUploadIndex] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function uploadOne(file: File, displayOrder: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      if (listingId) formData.append("listing_id", listingId);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: Math.round((event.loaded / event.total) * 100),
          }));
        }
      };

      xhr.onload = () => {
        let result: UploadApiResult;
        try {
          result = JSON.parse(xhr.responseText);
        } catch {
          reject(new Error("Invalid server response."));
          return;
        }

        if (xhr.status === 200 && result.thumb_url) {
          setImages((prev) => {
            const newImage: UploadedImage = {
              id: result.id,
              thumb_url: result.thumb_url!,
              medium_url: result.medium_url!,
              large_url: result.large_url!,
              og_url: result.og_url!,
              compression_pct: result.compression_pct,
              original_size_kb: result.original_size_kb,
              alt_text: "",
              display_order: displayOrder,
              is_primary: prev.length === 0,
            };
            const updated = [...prev, newImage];
            onUploaded(updated);
            return updated;
          });
          resolve();
        } else {
          reject(new Error(result.error ?? "Upload failed."));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload."));
      xhr.open("POST", "/api/upload/image");
      xhr.send(formData);
    });
  }

  async function uploadFiles(fileList: FileList) {
    const files = Array.from(fileList);
    let currentCount = images.length;
    const toUpload = files.slice(0, Math.max(0, maxFiles - currentCount));

    if (toUpload.length === 0) {
      setError(`You can only add up to ${maxFiles} photos.`);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadTotal(toUpload.length);

    for (let i = 0; i < toUpload.length; i++) {
      setUploadIndex(i + 1);

      try {
        await uploadOne(toUpload[i], currentCount);
        currentCount += 1;
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      }
    }

    setUploading(false);
    setUploadProgress({});
    setUploadIndex(0);
    setUploadTotal(0);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files.length > 0) {
      void uploadFiles(event.dataTransfer.files);
    }
  }

  function handleDelete(index: number) {
    setImages((prev) => {
      const wasPrimary = prev[index]?.is_primary;
      const filtered = prev.filter((_, i) => i !== index);
      const updated = filtered.map((image, i) => ({
        ...image,
        display_order: i,
        is_primary: wasPrimary ? i === 0 : image.is_primary,
      }));
      onUploaded(updated);
      return updated;
    });
  }

  function handleSetPrimary(index: number) {
    setImages((prev) => {
      const updated = prev.map((image, i) => ({ ...image, is_primary: i === index }));
      onUploaded(updated);
      return updated;
    });
  }

  function handleAltTextChange(index: number, value: string) {
    setImages((prev) => {
      const updated = prev.map((image, i) => (i === index ? { ...image, alt_text: value } : image));
      onUploaded(updated);
      return updated;
    });
  }

  function handleTileDrop(index: number) {
    if (draggedIndex !== null && draggedIndex !== index) {
      setImages((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(draggedIndex, 1);
        updated.splice(index, 0, moved);
        const reordered = updated.map((image, i) => ({ ...image, display_order: i }));
        onUploaded(reordered);
        return reordered;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  const progressValues = Object.values(uploadProgress);
  const overallProgress = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
    : 0;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            void uploadFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-xl border-2 border-dashed bg-white p-8 text-center transition ${
          isDragOver ? "border-2 border-secondary" : "border-primary hover:border-secondary"
        }`}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <p className="mt-3 font-semibold text-black">Drag &amp; drop photos here</p>
        <p className="text-sm text-primary-mid">or click to browse</p>
        <p className="mt-1 text-xs text-primary-mid">
          JPG, PNG, WebP · Max 10MB · Up to {maxFiles} photos
        </p>
      </div>

      {uploading && (
        <div className="mt-2">
          <div className="h-1 w-full rounded-full bg-primary">
            <div
              className="h-1 rounded-full bg-secondary transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-black">
            Uploading {uploadIndex} of {uploadTotal}...
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-5">
          {images.map((image, index) => (
            <div key={image.id ?? image.thumb_url} className="flex flex-col gap-1.5">
              <div
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragLeave={() => setDragOverIndex((current) => (current === index ? null : current))}
                onDrop={() => handleTileDrop(index)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                  image.is_primary ? "border-secondary" : "border-primary"
                } ${draggedIndex === index ? "opacity-50" : ""} ${
                  dragOverIndex === index && draggedIndex !== index ? "border-2 border-secondary" : ""
                }`}
              >
                <Image src={image.thumb_url} alt={image.alt_text || ""} fill className="object-cover" />

                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1 -translate-x-1/2 cursor-grab text-white"
                >
                  ⣿
                </span>

                {image.is_primary && (
                  <span className="absolute left-1 top-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    Primary
                  </span>
                )}

                {image.compression_pct != null && (
                  <span className="absolute bottom-1 left-1 rounded bg-black px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                    {image.compression_pct}% smaller
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  aria-label="Remove image"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white"
                >
                  ✕
                </button>

                {!image.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="absolute bottom-1 right-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Set main
                  </button>
                )}
              </div>

              <input
                value={image.alt_text}
                onChange={(event) => handleAltTextChange(index, event.target.value)}
                placeholder="Alt text (SEO)"
                className="w-full rounded border border-primary bg-white px-2 py-1 text-xs text-black"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
