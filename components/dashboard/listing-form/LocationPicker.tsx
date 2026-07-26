"use client";

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

const LAHORE: [number, number] = [31.5204, 74.3587];

export default function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Keep the latest onChange without re-creating the map/click handler
  // every time the parent re-renders with a new inline function. Updated in
  // an effect, not during render — mutating a ref synchronously in the
  // render body is itself flagged (refs are only safe to touch in effects
  // or event handlers).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const hasExisting = lat != null && lng != null;
    const center: [number, number] = hasExisting ? [lat, lng] : LAHORE;

    const map = L.map("location-picker").setView(center, 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const icon = L.divIcon({
      html: '<div style="background:#B4E717;border:2px solid #1C4B42;width:16px;height:16px;border-radius:50%"></div>',
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (hasExisting) {
      markerRef.current = L.marker(center, { icon }).addTo(map);
    }

    map.on("click", (event: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = event.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        markerRef.current = L.marker([clickLat, clickLng], { icon }).addTo(map);
      }

      onChangeRef.current(clickLat, clickLng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Only re-create the map on mount — re-centering on every lat/lng
    // change would fight with the user's own panning/zooming.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div id="location-picker" className="h-64 overflow-hidden rounded-xl border border-primary" />
      {lat != null && lng != null && (
        <p className="mt-2 text-xs text-primary-mid">
          Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
