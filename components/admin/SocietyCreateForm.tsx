"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createSocietyAction, updateSocietyAction, type SocietyImageInput } from "@/app/admin/societies/actions";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import type { UploadedImage } from "@/types";
import { inputClass, labelClass } from "./styles";

export interface CityOption {
  id: string;
  name: string;
}

interface AreaOption {
  id: string;
  name: string;
}

export interface SocietyInitialData {
  id: string;
  name: string;
  city_id: string;
  area_id: string | null;
  description: string | null;
  developer_name: string | null;
  established_yr: number | null;
  total_plots: number | null;
  total_phases: number | null;
  amenities: string[];
  cover_image_url: string | null;
  gallery_images: SocietyImageInput[];
}

// A society only ever stored a plain image URL before ImageUploader was
// wired in here, so a pre-existing cover/gallery entry may just be a bare
// URL with no thumb/medium/og variants — this fills those in with the same
// URL rather than leaving ImageUploader's <Image> props undefined.
function toUploadedImage(image: SocietyImageInput, index: number, isPrimary: boolean): UploadedImage {
  return {
    thumb_url: image.thumb_url ?? image.url,
    medium_url: image.url,
    large_url: image.url,
    og_url: image.url,
    alt_text: "",
    display_order: index,
    is_primary: isPrimary,
  };
}

export function SocietyForm({ cities, initial }: { cities: CityOption[]; initial?: SocietyInitialData }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [cityId, setCityId] = useState(initial?.city_id ?? "");
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areaId, setAreaId] = useState(initial?.area_id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [developerName, setDeveloperName] = useState(initial?.developer_name ?? "");
  const [establishedYr, setEstablishedYr] = useState(initial?.established_yr?.toString() ?? "");
  const [totalPlots, setTotalPlots] = useState(initial?.total_plots?.toString() ?? "");
  const [totalPhases, setTotalPhases] = useState(initial?.total_phases?.toString() ?? "");
  const [amenitiesText, setAmenitiesText] = useState(initial?.amenities.join("\n") ?? "");
  const [coverImage, setCoverImage] = useState<UploadedImage[]>(
    initial?.cover_image_url ? [toUploadedImage({ url: initial.cover_image_url, thumb_url: null }, 0, true)] : [],
  );
  const [galleryImages, setGalleryImages] = useState<UploadedImage[]>(
    (initial?.gallery_images ?? []).map((image, index) => toUploadedImage(image, index, false)),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Areas are scoped to the selected city, so they're only fetched once a
  // city is picked — same cascading-dropdown pattern as Step2Location. On
  // first render in edit mode this also re-fetches for the pre-selected
  // city, which is what populates the dropdown's existing value.
  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      return;
    }
    setLoadingAreas(true);
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

  function handleCityChange(value: string) {
    setCityId(value);
    setAreaId("");
  }

  async function handleSave() {
    setError(null);

    if (!name.trim()) return setError("Society name is required.");
    if (!cityId) return setError("Select a city.");

    setIsSaving(true);
    try {
      const payload = {
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
        cover_image_url: coverImage[0]?.large_url ?? null,
        gallery_images: galleryImages.map((image) => ({ url: image.large_url, thumb_url: image.thumb_url })),
      };

      if (isEdit) {
        await updateSocietyAction({ id: initial.id, ...payload });
        router.push("/admin/societies");
      } else {
        const result = await createSocietyAction(payload);
        router.push(`/admin/societies?created=${result.slug}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save society.");
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
              <select value={cityId} onChange={(event) => handleCityChange(event.target.value)} className={inputClass}>
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
        <p className="mt-1 text-xs text-primary-mid">Shown on the area-guide page header. Upload one photo.</p>
        <div className="mt-3">
          <ImageUploader folder="societies" maxFiles={1} existingImages={coverImage} onUploaded={setCoverImage} />
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Gallery Photos</h2>
        <p className="mt-1 text-xs text-primary-mid">Additional photos for the society page.</p>
        <div className="mt-3">
          <ImageUploader
            folder="societies"
            maxFiles={12}
            existingImages={galleryImages}
            onUploaded={setGalleryImages}
          />
        </div>
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-primary bg-white py-4">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Society"}
        </button>
      </div>
    </div>
  );
}
