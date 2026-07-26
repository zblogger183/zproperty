"use client";

import { useState } from "react";
import Image from "next/image";

export interface MediaItem {
  id: string;
  url: string;
  thumb_url: string | null;
  file_size_kb: number | null;
  width: number | null;
  height: number | null;
  folder: string;
}

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(item: MediaItem) {
    await navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((current) => (current === item.id ? null : current)), 1500);
  }

  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-primary-mid">No media uploaded yet.</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-7">
      {items.map((item) => (
        <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border border-primary">
          <Image src={item.thumb_url ?? item.url} alt="" fill className="object-cover" sizes="200px" />

          <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
            {item.folder}
          </span>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 p-2 text-center opacity-0 transition-opacity group-hover:opacity-100">
            <p className="text-[10px] text-white">{item.file_size_kb ? `${item.file_size_kb} KB` : ""}</p>
            <p className="text-[10px] text-white">
              {item.width && item.height ? `${item.width}×${item.height}` : ""}
            </p>
            <button
              type="button"
              onClick={() => void handleCopy(item)}
              className="mt-1 rounded bg-secondary px-2 py-1 text-[10px] font-bold text-primary"
            >
              {copiedId === item.id ? "Copied!" : "Copy URL"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
