"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

const LAHORE: [number, number] = [31.5204, 74.3587];

export interface LocationSearchContext {
  address?: string | null;
  cityName?: string | null;
  areaName?: string | null;
  societyName?: string | null;
}

function buildSearchQuery(ctx: LocationSearchContext): string {
  return [ctx.address, ctx.societyName, ctx.areaName, ctx.cityName, "Pakistan"]
    .filter(Boolean)
    .join(", ");
}

export default function LocationPicker({
  lat,
  lng,
  onChange,
  searchContext,
}: {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
  searchContext?: LocationSearchContext;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const iconRef = useRef<L.DivIcon | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [matchedName, setMatchedName] = useState<string | null>(null);

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
    iconRef.current = icon;

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

      setMatchedName(null);
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

  async function handleLocate() {
    const query = searchContext ? buildSearchQuery(searchContext) : "";
    if (!query || query === "Pakistan") {
      setGeocodeError("Enter an address, or pick a city/area first.");
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);
    setMatchedName(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const body = await res.json();

      if (!res.ok) {
        setGeocodeError(body.error ?? "Couldn't find that location.");
        return;
      }

      const { lat: foundLat, lng: foundLng, displayName } = body;
      const map = mapRef.current;
      if (!map || !iconRef.current) return;

      map.setView([foundLat, foundLng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([foundLat, foundLng]);
      } else {
        markerRef.current = L.marker([foundLat, foundLng], { icon: iconRef.current }).addTo(map);
      }

      setMatchedName(displayName);
      onChangeRef.current(foundLat, foundLng);
    } catch {
      setGeocodeError("Couldn't reach the geocoding service.");
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleLocate}
          disabled={geocoding}
          className="rounded-lg border border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
        >
          {geocoding ? "Locating..." : "📍 Locate on map"}
        </button>
        <p className="text-xs text-primary-mid">or click the map to place the pin manually</p>
      </div>

      <div id="location-picker" className="h-64 overflow-hidden rounded-xl border border-primary" />

      {geocodeError && <p className="mt-2 text-xs font-medium text-black">⚠ {geocodeError}</p>}
      {matchedName && !geocodeError && (
        <p className="mt-2 text-xs text-primary-mid">
          Found: {matchedName} — drag isn&apos;t supported yet, click the map to fine-tune.
        </p>
      )}
      {lat != null && lng != null && (
        <p className="mt-2 text-xs text-primary-mid">
          Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
