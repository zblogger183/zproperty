"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export interface GalleryImage {
  thumb_url: string;
  large_url: string;
  alt_text: string | null;
  display_order: number;
}

function toYoutubeEmbedUrl(url: string): string {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  return url;
}

export function ImageGallery({
  images,
  videoUrl,
  title,
}: {
  images: GalleryImage[];
  videoUrl?: string | null;
  title: string;
}) {
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", fullscreen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [fullscreen]);

  if (sorted.length === 0 && !videoUrl) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-primary-mid text-center text-white">
        No photos available
      </div>
    );
  }

  const activeImage = sorted[activeIndex];

  function goPrev() {
    setActiveIndex((index) => (index - 1 + sorted.length) % sorted.length);
  }

  function goNext() {
    setActiveIndex((index) => (index + 1) % sorted.length);
  }

  return (
    <div className="relative">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-primary">
        {showVideo && videoUrl ? (
          <iframe
            src={toYoutubeEmbedUrl(videoUrl)}
            title={`${title} video`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : activeImage ? (
          <Image
            src={activeImage.large_url}
            alt={activeImage.alt_text ?? title}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-mid text-white">
            No photos available
          </div>
        )}

        {!showVideo && sorted.length > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-bold text-secondary">
            {activeIndex + 1} / {sorted.length}
          </span>
        )}

        {!showVideo && activeImage && (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute left-3 top-3 rounded-lg bg-black px-2 py-1 text-xs text-white"
          >
            ⛶ Fullscreen
          </button>
        )}
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {videoUrl && (
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            className={`flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border-2 bg-primary px-1 text-center text-xs text-white ${
              showVideo ? "border-secondary" : "border-primary"
            }`}
          >
            ▶ Video
          </button>
        )}

        {sorted.map((image, index) => (
          <button
            key={image.thumb_url}
            type="button"
            onClick={() => {
              setShowVideo(false);
              setActiveIndex(index);
            }}
            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
              !showVideo && index === activeIndex
                ? "border-secondary"
                : "border-primary opacity-60 hover:opacity-100"
            }`}
          >
            <Image src={image.thumb_url} alt={image.alt_text ?? title} fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      {fullscreen && activeImage && (
        <div className="absolute inset-0 z-50 min-h-screen overflow-hidden bg-black">
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 text-2xl text-white"
            aria-label="Close fullscreen"
          >
            ✕
          </button>

          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-secondary"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-secondary"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          <div className="mx-auto flex h-full max-h-[85vh] max-w-[90vw] items-center justify-center">
            <div className="relative h-full w-full">
              <Image
                src={activeImage.large_url}
                alt={activeImage.alt_text ?? title}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
