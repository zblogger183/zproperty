import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Nominatim (OpenStreetMap's own geocoder — matches the OSM tiles the map
// already uses, no API key). Its usage policy requires a real identifying
// User-Agent and caps unauthenticated public proxies at ~1 request/second;
// this route is behind login (only agents/admins filling in the listing
// form call it) which keeps volume low enough to stay within that. If
// listing-creation volume grows enough to hit 429s, swap this one function
// for a paid provider (Google/Mapbox) — nothing else in the form needs to
// change, since the response shape (lat/lng) stays the same.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ZProperty.pk/1.0 (info@zproperty.pk)";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("countrycodes", "pk");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);

  let response: Response;
  try {
    response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  } catch {
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }

  const results = (await response.json()) as NominatimResult[];
  const match = results[0];

  if (!match) {
    return NextResponse.json({ error: "No matching location found" }, { status: 404 });
  }

  return NextResponse.json({
    lat: parseFloat(match.lat),
    lng: parseFloat(match.lon),
    displayName: match.display_name,
  });
}
