"use client";

import { useState } from "react";

export function ImageGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-secondary bg-secondary/30 text-sm text-text">
        No images
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-secondary">
        <img src={images[active]} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border ${
              index === active ? "border-primary" : "border-secondary"
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
