"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { Step2Data } from "@/app/dashboard/listings/schemas";
import { inputClass, labelClass, errorClass } from "./styles";

// dynamic(..., { ssr: false }) is fine here directly since Step2Location
// itself is already a Client Component — the "must live in a Client
// Component" rule only bites when the dynamic() call is made from a Server
// Component (see MiniMapLoader.tsx for that case on the listing detail page).
const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-primary-mid" />,
});

interface Option {
  id: string;
  name: string;
}

export function Step2Location({
  data,
  errors,
  onChange,
}: {
  data: Partial<Step2Data>;
  errors: Record<string, string>;
  onChange: (data: Partial<Step2Data>) => void;
}) {
  const [cities, setCities] = useState<Option[]>([]);
  const [areas, setAreas] = useState<Option[]>([]);
  const [societies, setSocieties] = useState<Option[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingSocieties, setLoadingSocieties] = useState(false);

  // Clearing the downstream list when its parent selection disappears is a
  // pure derived-state reset, not a fetch — done here as a render-time
  // adjustment (React's documented pattern for "reset state when a value
  // changes") so the effects below only ever setState from inside their
  // fetch callbacks, which is the endorsed effect pattern.
  const [prevCityId, setPrevCityId] = useState(data.city_id);
  if (data.city_id !== prevCityId) {
    setPrevCityId(data.city_id);
    if (areas.length > 0) setAreas([]);
  }

  const [prevAreaId, setPrevAreaId] = useState(data.area_id);
  if (data.area_id !== prevAreaId) {
    setPrevAreaId(data.area_id);
    if (societies.length > 0) setSocieties([]);
  }

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase
      .from("cities")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data: rows }) => {
        if (active) {
          setCities((rows ?? []) as Option[]);
          setLoadingCities(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data.city_id) return;

    const supabase = createClient();
    let active = true;
    // Unlike the reset above, this isn't stale derived state — it's the
    // start of the fetch this same effect kicks off, which has no prior
    // render-time value to compare against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingAreas(true);

    supabase
      .from("areas")
      .select("id, name, slug")
      .eq("city_id", data.city_id)
      .eq("is_active", true)
      .order("display_order")
      .then(({ data: rows }) => {
        if (active) {
          setAreas((rows ?? []) as Option[]);
          setLoadingAreas(false);
        }
      });

    return () => {
      active = false;
    };
  }, [data.city_id]);

  useEffect(() => {
    if (!data.area_id) return;

    const supabase = createClient();
    let active = true;
    // See the areas effect above — this is the start of a fetch, not a
    // stale-state reset.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSocieties(true);

    supabase
      .from("societies")
      .select("id, name, slug")
      .eq("area_id", data.area_id)
      .eq("is_active", true)
      .order("name")
      .then(({ data: rows }) => {
        if (active) {
          setSocieties((rows ?? []) as Option[]);
          setLoadingSocieties(false);
        }
      });

    return () => {
      active = false;
    };
  }, [data.area_id]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>City</label>
        <select
          value={data.city_id ?? ""}
          disabled={loadingCities}
          onChange={(event) =>
            onChange({ city_id: event.target.value, area_id: undefined, society_id: undefined })
          }
          className={inputClass}
        >
          <option value="">{loadingCities ? "Loading cities..." : "Select city"}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {errors.city_id && <p className={errorClass}>⚠ {errors.city_id}</p>}
      </div>

      <div>
        <label className={labelClass}>Area</label>
        <select
          value={data.area_id ?? ""}
          disabled={!data.city_id || loadingAreas}
          onChange={(event) => onChange({ area_id: event.target.value, society_id: undefined })}
          className={inputClass}
        >
          <option value="">{loadingAreas ? "Loading areas..." : "Select area"}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        {errors.area_id && <p className={errorClass}>⚠ {errors.area_id}</p>}
      </div>

      <div>
        <label className={labelClass}>Society (optional)</label>
        <select
          value={data.society_id ?? ""}
          disabled={!data.area_id || loadingSocieties}
          onChange={(event) => onChange({ society_id: event.target.value || null })}
          className={inputClass}
        >
          <option value="">None / Independent</option>
          {societies.map((society) => (
            <option key={society.id} value={society.id}>
              {society.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <input
          value={data.address ?? ""}
          onChange={(event) => onChange({ address: event.target.value })}
          placeholder="Street address (optional)"
          className={inputClass}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-black">Pin the exact location (optional)</p>
        <LocationPicker lat={data.lat} lng={data.lng} onChange={(lat, lng) => onChange({ lat, lng })} />
      </div>
    </div>
  );
}
