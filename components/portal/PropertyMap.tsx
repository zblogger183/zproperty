"use client";

export function PropertyMap({
  latitude,
  longitude,
}: {
  latitude?: number;
  longitude?: number;
}) {
  return (
    <div className="flex h-80 w-full items-center justify-center rounded-lg border border-secondary bg-secondary/30 text-sm text-text">
      {latitude && longitude
        ? `Map centered at ${latitude}, ${longitude}`
        : "Leaflet map mounts here"}
    </div>
  );
}
