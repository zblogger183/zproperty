"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDeveloperProjectAction,
  updateDeveloperProjectAction,
  type DeveloperProjectInput,
} from "@/app/dashboard/projects/actions";
import type { ProjectUnitTypeInput } from "@/app/admin/projects/actions";
import { Step2Location } from "@/components/dashboard/listing-form/Step2Location";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { inputClass, labelClass, errorClass } from "@/components/admin/styles";
import type { UploadedImage } from "@/types";

// type/property_type/status are DB check-constrained — kept identical to
// components/admin/ProjectCreateForm.tsx's option lists.
const TYPE_OPTIONS = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed", label: "Mixed" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "flats", label: "Flats / Apartments" },
  { value: "houses", label: "Houses" },
  { value: "plots", label: "Plots" },
  { value: "shops", label: "Shops" },
  { value: "offices", label: "Offices" },
  { value: "mixed", label: "Mixed" },
];

const STATUS_OPTIONS = [
  { value: "pre_launch", label: "Pre-Launch" },
  { value: "launching", label: "Launching" },
  { value: "under_construction", label: "Under Construction" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
];

interface LocationState {
  city_id?: string;
  area_id?: string;
  society_id?: string | null;
  address?: string;
  lat?: number | null;
  lng?: number | null;
}

interface UnitTypeRow extends ProjectUnitTypeInput {
  key: string;
}

function emptyUnitType(): UnitTypeRow {
  return { key: crypto.randomUUID(), unit_type: "" };
}

export interface ProjectFormInitialData {
  id: string;
  name: string;
  tagline: string | null;
  type: string | null;
  property_type: string;
  status: string;
  status_platform: string;
  reject_reason: string | null;
  description: string | null;
  location: LocationState;
  launch_date: string | null;
  possession_date: string | null;
  completion_pct: number | null;
  total_units: number | null;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  amenities: string[];
  images: UploadedImage[];
  video_url: string | null;
  virtual_tour_url: string | null;
  brochure_url: string | null;
  unit_types: ProjectUnitTypeInput[];
}

export function ProjectForm({ initial }: { initial?: ProjectFormInitialData }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [type, setType] = useState(initial?.type ?? "residential");
  const [propertyType, setPropertyType] = useState(initial?.property_type ?? "flats");
  const [status, setStatus] = useState(initial?.status ?? "under_construction");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState<LocationState>(initial?.location ?? {});
  const [launchDate, setLaunchDate] = useState(initial?.launch_date ?? "");
  const [possessionDate, setPossessionDate] = useState(initial?.possession_date ?? "");
  const [completionPct, setCompletionPct] = useState(initial?.completion_pct?.toString() ?? "");
  const [totalUnits, setTotalUnits] = useState(initial?.total_units?.toString() ?? "");
  const [minPrice, setMinPrice] = useState(initial?.min_price?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(initial?.max_price?.toString() ?? "");
  const [minArea, setMinArea] = useState(initial?.min_area?.toString() ?? "");
  const [maxArea, setMaxArea] = useState(initial?.max_area?.toString() ?? "");
  const [amenitiesText, setAmenitiesText] = useState(initial?.amenities.join("\n") ?? "");
  const [images, setImages] = useState<{ url: string; thumb_url: string | null }[]>(
    initial?.images.map((image) => ({ url: image.large_url, thumb_url: image.thumb_url })) ?? [],
  );
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [virtualTourUrl, setVirtualTourUrl] = useState(initial?.virtual_tour_url ?? "");
  const [brochureUrl, setBrochureUrl] = useState(initial?.brochure_url ?? "");
  const [isUploadingBrochure, setIsUploadingBrochure] = useState(false);
  const [brochureError, setBrochureError] = useState<string | null>(null);
  const [unitTypes, setUnitTypes] = useState<UnitTypeRow[]>(
    initial && initial.unit_types.length > 0
      ? initial.unit_types.map((unit) => ({ ...unit, key: crypto.randomUUID() }))
      : [emptyUnitType()],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  function updateUnitType(key: string, field: keyof ProjectUnitTypeInput, value: string) {
    setUnitTypes((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const isNumeric = field !== "unit_type" && field !== "notes";
        return { ...row, [field]: isNumeric ? (value === "" ? null : Number(value)) : value };
      }),
    );
  }

  async function handleBrochureFile(file: File) {
    setIsUploadingBrochure(true);
    setBrochureError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "projects");

      const response = await fetch("/api/upload/pdf", { method: "POST", body: formData });
      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Upload failed.");
      }
      setBrochureUrl(result.url);
    } catch (uploadError) {
      setBrochureError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploadingBrochure(false);
    }
  }

  async function handleSave() {
    setError(null);

    if (!name.trim()) return setError("Project name is required.");
    if (!location.city_id) return setError("Select a city.");

    setIsSaving(true);
    try {
      const payload: DeveloperProjectInput = {
        name,
        tagline,
        type,
        property_type: propertyType,
        city_id: location.city_id,
        area_id: location.area_id ?? null,
        society_id: location.society_id ?? null,
        address: location.address,
        lat: location.lat ?? null,
        lng: location.lng ?? null,
        description,
        amenities: amenitiesText.split("\n").map((line) => line.trim()).filter(Boolean),
        status,
        launch_date: launchDate || null,
        possession_date: possessionDate || null,
        completion_pct: completionPct ? Number(completionPct) : null,
        total_units: totalUnits ? Number(totalUnits) : null,
        min_price: minPrice ? Number(minPrice) : null,
        max_price: maxPrice ? Number(maxPrice) : null,
        min_area: minArea ? Number(minArea) : null,
        max_area: maxArea ? Number(maxArea) : null,
        video_url: videoUrl,
        virtual_tour_url: virtualTourUrl,
        brochure_url: brochureUrl || null,
        images,
        unit_types: unitTypes,
      };

      if (isEdit && initial) {
        await updateDeveloperProjectAction(initial.id, payload);
        router.push("/dashboard/projects?updated=true");
      } else {
        await createDeveloperProjectAction(payload);
        router.push("/dashboard/projects?submitted=true");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save project.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6 pb-16">
      {error && (
        <p className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      {isEdit && initial?.status_platform === "rejected" && (
        <div className="rounded-xl border-l-4 border-primary bg-white p-4">
          <p className="text-sm font-semibold text-black">This project was rejected.</p>
          {initial.reject_reason && <p className="mt-1 text-sm text-primary-mid">Reason: {initial.reject_reason}</p>}
          <p className="mt-1 text-sm text-primary-mid">Saving changes resubmits it for review.</p>
        </div>
      )}

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Basic Info</h2>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <label className={labelClass}>Project Name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="e.g. Skyline Heights" />
          </div>
          <div>
            <label className={labelClass}>Tagline (optional)</label>
            <input value={tagline} onChange={(event) => setTagline(event.target.value)} className={inputClass} placeholder="e.g. Luxury living in the heart of the city" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Property Type</label>
              <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className={inputClass}>
                {PROPERTY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Construction Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className={inputClass} placeholder="What's this project about?" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-black">Location</h2>
        <Step2Location
          data={location}
          errors={{}}
          onChange={(update) => setLocation((prev) => ({ ...prev, ...update }))}
        />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Timeline &amp; Scale</h2>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Launch Date</label>
            <input type="date" value={launchDate} onChange={(event) => setLaunchDate(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Possession Date</label>
            <input type="date" value={possessionDate} onChange={(event) => setPossessionDate(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Completion %</label>
            <input type="number" min="0" max="100" value={completionPct} onChange={(event) => setCompletionPct(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total Units</label>
            <input type="number" min="0" value={totalUnits} onChange={(event) => setTotalUnits(event.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Price &amp; Area Range</h2>
        <p className="mt-1 text-xs text-primary-mid">Shown on listing cards — the full breakdown per unit type goes below.</p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Min Price (PKR)</label>
            <input type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Max Price (PKR)</label>
            <input type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Min Area (sqft)</label>
            <input type="number" value={minArea} onChange={(event) => setMinArea(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Max Area (sqft)</label>
            <input type="number" value={maxArea} onChange={(event) => setMaxArea(event.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Amenities</h2>
        <p className="mt-1 text-xs text-primary-mid">One per line.</p>
        <textarea value={amenitiesText} onChange={(event) => setAmenitiesText(event.target.value)} rows={4} className={`${inputClass} mt-2`} placeholder={"Swimming Pool\nGym\n24/7 Security"} />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Photos</h2>
        <p className="mt-1 text-xs text-primary-mid">First photo becomes the cover image.</p>
        <div className="mt-3">
          <ImageUploader
            folder="projects"
            maxFiles={20}
            existingImages={initial?.images}
            onUploaded={(uploaded) => setImages(uploaded.map((image) => ({ url: image.large_url, thumb_url: image.thumb_url })))}
          />
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Brochure / Master Plan</h2>
        <input
          ref={brochureInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleBrochureFile(file);
            event.target.value = "";
          }}
        />
        {brochureUrl ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-secondary bg-white p-3">
            <span className="text-sm font-semibold text-black">✓ PDF uploaded</span>
            <a href={brochureUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View</a>
            <button type="button" disabled={isUploadingBrochure} onClick={() => brochureInputRef.current?.click()} className="ml-auto cursor-pointer text-xs text-primary-mid underline disabled:opacity-60">
              {isUploadingBrochure ? "Uploading..." : "Replace"}
            </button>
            <button type="button" onClick={() => setBrochureUrl("")} className="cursor-pointer text-xs text-primary-mid underline">Remove</button>
          </div>
        ) : (
          <button type="button" disabled={isUploadingBrochure} onClick={() => brochureInputRef.current?.click()} className="mt-3 w-full cursor-pointer rounded-lg border-2 border-dashed border-primary p-4 text-center text-sm font-semibold text-black disabled:opacity-60">
            {isUploadingBrochure ? "Uploading..." : "Upload Brochure PDF"}
          </button>
        )}
        {brochureError && <p className={errorClass}>⚠ {brochureError}</p>}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Video URL (optional)</label>
            <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} className={inputClass} placeholder="YouTube link" />
          </div>
          <div>
            <label className={labelClass}>Virtual Tour URL (optional)</label>
            <input value={virtualTourUrl} onChange={(event) => setVirtualTourUrl(event.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Unit Types &amp; Payment Plans</h2>
        <p className="mt-1 text-xs text-primary-mid">Studio, 1 Bed, 2 Bed, Penthouse, Commercial — one card per unit type, each with its own price and payment terms.</p>

        <div className="mt-4 flex flex-col gap-4">
          {unitTypes.map((row, index) => (
            <div key={row.key} className="rounded-lg border border-primary p-4">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Unit Type Name</label>
                {unitTypes.length > 1 && (
                  <button type="button" onClick={() => setUnitTypes((prev) => prev.filter((r) => r.key !== row.key))} className="text-xs text-primary-mid underline">
                    Remove
                  </button>
                )}
              </div>
              <input value={row.unit_type} onChange={(event) => updateUnitType(row.key, "unit_type", event.target.value)} className={inputClass} placeholder="e.g. 2 Bedroom" />

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Total Price (PKR)</label>
                  <input type="number" value={row.total_price ?? ""} onChange={(event) => updateUnitType(row.key, "total_price", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Advance %</label>
                  <input type="number" value={row.advance_pct ?? ""} onChange={(event) => updateUnitType(row.key, "advance_pct", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Advance Amount</label>
                  <input type="number" value={row.advance_amount ?? ""} onChange={(event) => updateUnitType(row.key, "advance_amount", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Installment Years</label>
                  <input type="number" value={row.installment_yrs ?? ""} onChange={(event) => updateUnitType(row.key, "installment_yrs", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Monthly Installment</label>
                  <input type="number" value={row.monthly_installment ?? ""} onChange={(event) => updateUnitType(row.key, "monthly_installment", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>On Possession %</label>
                  <input type="number" value={row.on_possession_pct ?? ""} onChange={(event) => updateUnitType(row.key, "on_possession_pct", event.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>On Possession Amount</label>
                  <input type="number" value={row.on_possession_amt ?? ""} onChange={(event) => updateUnitType(row.key, "on_possession_amt", event.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelClass}>Notes (optional)</label>
                <input value={row.notes ?? ""} onChange={(event) => updateUnitType(row.key, "notes", event.target.value)} className={inputClass} />
              </div>
              {index === unitTypes.length - 1 && (
                <button
                  type="button"
                  onClick={() => setUnitTypes((prev) => [...prev, emptyUnitType()])}
                  className="mt-3 text-xs font-semibold text-primary underline"
                >
                  + Add another unit type
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-primary bg-white py-4">
        {!isEdit && (
          <p className="text-xs text-primary-mid">
            Your project will be reviewed by our team before going live (usually within 24 hours).
          </p>
        )}
        <button type="button" disabled={isSaving} onClick={() => void handleSave()} className="w-fit rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary disabled:opacity-60">
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Submit for Review"}
        </button>
      </div>
    </div>
  );
}
