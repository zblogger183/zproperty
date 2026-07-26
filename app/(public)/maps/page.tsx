"use client";

import { useState } from "react";

export default function MapSearchPage() {
  const [ready] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-primary">Map Search</h1>
      <p className="mt-2 text-primary-mid">Client-rendered map search — Leaflet map mounts here.</p>
      <div className="mt-6 h-[60vh] w-full rounded-lg border border-secondary bg-secondary/30">
        {!ready && (
          <div className="flex h-full items-center justify-center text-sm text-black">
            Map placeholder
          </div>
        )}
      </div>
    </div>
  );
}
