"use client";

import { useEffect } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MiniMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  useEffect(() => {
    const map = L.map("mini-map").setView([lat, lng], 15);

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

    L.marker([lat, lng], { icon }).addTo(map).bindPopup(title);

    return () => {
      map.remove();
    };
  }, [lat, lng, title]);

  return <div id="mini-map" className="h-48 w-full overflow-hidden rounded-xl border border-primary" />;
}
