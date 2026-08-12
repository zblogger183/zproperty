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

const ADD_NEW = "__add_new__";

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
  const [phases, setPhases] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingSocieties, setLoadingSocieties] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

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

  const [prevSocietyId, setPrevSocietyId] = useState(data.society_id);
  if (data.society_id !== prevSocietyId) {
    setPrevSocietyId(data.society_id);
    if (phases.length > 0) setPhases([]);
    if (blocks.length > 0) setBlocks([]);
    setAddingPhase(false);
    setAddingBlock(false);
  }

  const [prevPhaseId, setPrevPhaseId] = useState(data.phase_id);
  if (data.phase_id !== prevPhaseId) {
    setPrevPhaseId(data.phase_id);
    if (blocks.length > 0) setBlocks([]);
    setAddingBlock(false);
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

  useEffect(() => {
    if (!data.society_id) return;

    const supabase = createClient();
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingPhases(true);

    supabase
      .from("society_phases")
      .select("id, name")
      .eq("society_id", data.society_id)
      .order("name")
      .then(({ data: rows }) => {
        if (active) {
          setPhases((rows ?? []) as Option[]);
          setLoadingPhases(false);
        }
      });

    return () => {
      active = false;
    };
  }, [data.society_id]);

  // Blocks scope to the selected phase when one exists for this society, or
  // to phase-less blocks (phase_id IS NULL) for societies with no phase
  // concept at all — never mixes the two, so picking "Phase 6" never shows
  // an unrelated society-wide block list.
  useEffect(() => {
    if (!data.society_id) return;

    const supabase = createClient();
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingBlocks(true);

    let query = supabase.from("society_blocks").select("id, name").eq("society_id", data.society_id);
    query = data.phase_id ? query.eq("phase_id", data.phase_id) : query.is("phase_id", null);

    query.order("name").then(({ data: rows }) => {
      if (active) {
        setBlocks((rows ?? []) as Option[]);
        setLoadingBlocks(false);
      }
    });

    return () => {
      active = false;
    };
  }, [data.society_id, data.phase_id]);

  async function handleAddPhase() {
    const name = newPhaseName.trim();
    if (!name || !data.society_id) return;
    setAddError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAddError("You must be signed in to add a phase.");
      return;
    }

    const { data: created, error } = await supabase
      .from("society_phases")
      .insert({ society_id: data.society_id, name, created_by: user.id })
      .select("id, name")
      .single();

    if (error || !created) {
      setAddError(error?.message ?? "Could not add that phase.");
      return;
    }

    setPhases((prev) => [...prev, created as Option].sort((a, b) => a.name.localeCompare(b.name)));
    onChange({ phase_id: created.id, block_id: null });
    setAddingPhase(false);
    setNewPhaseName("");
  }

  async function handleAddBlock() {
    const name = newBlockName.trim();
    if (!name || !data.society_id) return;
    setAddError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAddError("You must be signed in to add a block.");
      return;
    }

    const { data: created, error } = await supabase
      .from("society_blocks")
      .insert({ society_id: data.society_id, phase_id: data.phase_id ?? null, name, created_by: user.id })
      .select("id, name")
      .single();

    if (error || !created) {
      setAddError(error?.message ?? "Could not add that block.");
      return;
    }

    setBlocks((prev) => [...prev, created as Option].sort((a, b) => a.name.localeCompare(b.name)));
    onChange({ block_id: created.id });
    setAddingBlock(false);
    setNewBlockName("");
  }

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
          onChange={(event) =>
            onChange({ society_id: event.target.value || null, phase_id: null, block_id: null })
          }
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

      {/* Phase/Block only make sense once a society is picked — DHA has
          Phase -> Block, a smaller society might only have Block, and an
          independent property (no society) has neither. */}
      {data.society_id && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Phase (optional)</label>
            {addingPhase ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newPhaseName}
                  onChange={(event) => setNewPhaseName(event.target.value)}
                  placeholder="e.g. Phase 6"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleAddPhase}
                  className="shrink-0 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-primary"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingPhase(false);
                    setNewPhaseName("");
                  }}
                  className="shrink-0 rounded-lg border border-primary px-3 py-2 text-xs text-primary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={data.phase_id ?? ""}
                disabled={loadingPhases}
                onChange={(event) => {
                  if (event.target.value === ADD_NEW) {
                    setAddingPhase(true);
                    return;
                  }
                  onChange({ phase_id: event.target.value || null, block_id: null });
                }}
                className={inputClass}
              >
                <option value="">{loadingPhases ? "Loading phases..." : "No phase / not applicable"}</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
                <option value={ADD_NEW}>+ Add a new phase...</option>
              </select>
            )}
          </div>

          <div>
            <label className={labelClass}>Block / Sector (optional)</label>
            {addingBlock ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newBlockName}
                  onChange={(event) => setNewBlockName(event.target.value)}
                  placeholder="e.g. Block L"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="shrink-0 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-primary"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingBlock(false);
                    setNewBlockName("");
                  }}
                  className="shrink-0 rounded-lg border border-primary px-3 py-2 text-xs text-primary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={data.block_id ?? ""}
                disabled={loadingBlocks}
                onChange={(event) => {
                  if (event.target.value === ADD_NEW) {
                    setAddingBlock(true);
                    return;
                  }
                  onChange({ block_id: event.target.value || null });
                }}
                className={inputClass}
              >
                <option value="">{loadingBlocks ? "Loading blocks..." : "No block / not applicable"}</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
                <option value={ADD_NEW}>+ Add a new block...</option>
              </select>
            )}
          </div>
        </div>
      )}
      {addError && <p className={errorClass}>⚠ {addError}</p>}

      {data.society_id && (
        <div>
          <label className={labelClass}>Plot / House Number (optional)</label>
          <input
            value={data.plot_number ?? ""}
            onChange={(event) => onChange({ plot_number: event.target.value })}
            placeholder="e.g. 123-A"
            className={inputClass}
          />
        </div>
      )}

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
        <LocationPicker
          lat={data.lat}
          lng={data.lng}
          onChange={(lat, lng) => onChange({ lat, lng })}
          searchContext={{
            address: data.address,
            cityName: cities.find((c) => c.id === data.city_id)?.name,
            areaName: areas.find((a) => a.id === data.area_id)?.name,
            societyName: societies.find((s) => s.id === data.society_id)?.name,
          }}
        />
      </div>
    </div>
  );
}
