"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createSocietyAction } from "@/app/admin/societies/actions";
import { inputClass, labelClass } from "./styles";

export interface CityOption {
  id: string;
  name: string;
}

interface AreaOption {
  id: string;
  name: string;
}

export function SocietyCreateForm({ cities }: { cities: CityOption[] }) {
  const router = useRouter();

  const [cityId, setCityId] = useState("");
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areaId, setAreaId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [establishedYr, setEstablishedYr] = useState("");
  const [totalPlots, setTotalPlots] = useState("");
  const [totalPhases, setTotalPhases] = useState("");
  const [amenitiesText, setAmenitiesText] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Areas are scoped to the selected city, so they're only fetched once a
  // city is picked — same cascading-dropdown pattern as Step2Location.
  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      setAreaId("");
      return;
    }
    setLoadingAreas(true);
    setAreaId("");
    const supabase = createClient();
    supabase
      .from("areas")
      .select("id, name")
      .eq("city_id", cityId)
      .order("name")
      .then(({ data }) => {
        setAreas((data ?? []) as AreaOption[]);
        setLoadingAreas(false);
      });
  }, [cityId]);

  async function handleSave() {
    setError(null);

    if (!name.trim()) return setError("Society name is required.");
    if (!cityId) return setError("Select a city.");

    setIsSaving(true);
    try {
      const result = await createSocietyAction({
        name,
        city_id: cityId,
        area_id: areaId || null,
        description,
        developer_name: developerName,
        established_yr: establishedYr ? Number(establishedYr) : null,
        total_plots: totalPlots ? Number(totalPlots) : null,
        total_phases: totalPhases ? Number(totalPhases) : null,
        amenities: amenitiesText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        cover_image_url: coverImageUrl || null,
      });
      router.push(`/admin/societies?created=${result.slug}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create society.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 pb-16">
      {error && (
        <p className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Basic Info</h2>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <label className={labelClass}>Society Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
              placeholder="e.g. Bahria Orchard"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>City</label>
              <select value={cityId} onChange={(event) => setCityId(event.target.value)} className={inputClass}>
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Area (optional)</label>
              <select
                value={areaId}
                onChange={(event) => setAreaId(event.target.value)}
                disabled={!cityId || loadingAreas}
                className={inputClass}
              >
                <option value="">{loadingAreas ? "Loading..." : "No area"}</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {cityId && areas.length === 0 && !loadingAreas && (
                <p className="mt-1 text-xs text-primary-mid">No areas exist for this city yet — leave blank.</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className={inputClass}
              placeholder="What is this housing scheme, who developed it, how is it structured..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Scheme Details</h2>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Master Developer (optional)</label>
            <input
              value={developerName}
              onChange={(event) => setDeveloperName(event.target.value)}
              className={inputClass}
              placeholder="e.g. Bahria Town (Pvt) Ltd"
            />
          </div>
          <div>
            <label className={labelClass}>Established Year</label>
            <input
              type="number"
              value={establishedYr}
              onChange={(event) => setEstablishedYr(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Total Plots</label>
            <input
              type="number"
              min="0"
              value={totalPlots}
              onChange={(event) => setTotalPlots(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Total Phases</label>
            <input
              type="number"
              min="0"
              value={totalPhases}
              onChange={(event) => setTotalPhases(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Amenities</h2>
        <p className="mt-1 text-xs text-primary-mid">One per line.</p>
        <textarea
          value={amenitiesText}
          onChange={(event) => setAmenitiesText(event.target.value)}
          rows={4}
          className={`${inputClass} mt-2`}
          placeholder={"Gated Community\nParks\n24/7 Security"}
        />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Cover Image</h2>
        <p className="mt-1 text-xs text-primary-mid">Paste an image URL (upload support can be added later, same as projects).</p>
        <input
          value={coverImageUrl}
          onChange={(event) => setCoverImageUrl(event.target.value)}
          className={`${inputClass} mt-2`}
          placeholder="https://..."
        />
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-primary bg-white py-4">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Creating..." : "Create Society"}
        </button>
      </div>
    </div>
  );
}
