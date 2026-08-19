"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAreaGuideAction, deleteAreaGuideAction } from "@/app/admin/content/area-guides/actions";
import { inputClass } from "./styles";

export interface AreaGuideInitial {
  overview: string;
  pros: string[];
  cons: string[];
  review_summary: string;
  meta_title: string;
  meta_desc: string;
  is_published: boolean;
  map_pdf_url: string;
}

export function AreaGuideEditor({
  societyId,
  societyName,
  initial,
  hasExistingGuide,
  hasCoordinates,
}: {
  societyId: string;
  societyName: string;
  initial: AreaGuideInitial;
  hasExistingGuide: boolean;
  hasCoordinates: boolean;
}) {
  const router = useRouter();
  const [overview, setOverview] = useState(initial.overview);
  const [prosText, setProsText] = useState(initial.pros.join("\n"));
  const [consText, setConsText] = useState(initial.cons.join("\n"));
  const [reviewSummary, setReviewSummary] = useState(initial.review_summary);
  const [metaTitle, setMetaTitle] = useState(initial.meta_title);
  const [metaDesc, setMetaDesc] = useState(initial.meta_desc);
  const [isPublished, setIsPublished] = useState(initial.is_published);
  const [mapPdfUrl, setMapPdfUrl] = useState(initial.map_pdf_url);
  const [isUploadingMap, setIsUploadingMap] = useState(false);
  const [mapUploadError, setMapUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapFileInputRef = useRef<HTMLInputElement>(null);

  async function handleMapFile(file: File) {
    setIsUploadingMap(true);
    setMapUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/society-map", { method: "POST", body: formData });
      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Upload failed.");
      }
      setMapPdfUrl(result.url);
    } catch (uploadError) {
      setMapUploadError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploadingMap(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSavedMessage(false);

    try {
      await saveAreaGuideAction(societyId, {
        overview,
        pros: prosText.split("\n").map((line) => line.trim()).filter(Boolean),
        cons: consText.split("\n").map((line) => line.trim()).filter(Boolean),
        review_summary: reviewSummary,
        meta_title: metaTitle,
        meta_desc: metaDesc,
        is_published: isPublished,
        map_pdf_url: mapPdfUrl,
      });
      setSavedMessage(true);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save guide.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete the area guide for ${societyName}? This cannot be undone.`)) return;
    setIsSaving(true);
    try {
      await deleteAreaGuideAction(societyId);
      router.push("/admin/content/area-guides");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 pb-8">
      {error && (
        <p className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      <section className="rounded-xl border border-primary bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-black">Publish Status</h2>
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            onClick={() => setIsPublished((value) => !value)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              isPublished ? "bg-secondary" : "bg-primary-mid"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                isPublished ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>
        <p className="mt-2 text-xs text-primary-mid">
          {isPublished ? "Visible on the public area guide page." : "Hidden from the public site."}
        </p>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Overview</h2>
        <textarea
          value={overview}
          onChange={(event) => setOverview(event.target.value)}
          rows={5}
          placeholder={`What's it like to live in ${societyName}?`}
          className={`${inputClass} mt-3`}
        />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Pros &amp; Cons</h2>
        <p className="mt-1 text-xs text-primary-mid">One point per line.</p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary-mid">Pros</label>
            <textarea
              value={prosText}
              onChange={(event) => setProsText(event.target.value)}
              rows={5}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-mid">Cons</label>
            <textarea
              value={consText}
              onChange={(event) => setConsText(event.target.value)}
              rows={5}
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Review Summary</h2>
        <textarea
          value={reviewSummary}
          onChange={(event) => setReviewSummary(event.target.value)}
          rows={3}
          placeholder="A short summary of resident sentiment..."
          className={`${inputClass} mt-3`}
        />
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Map</h2>
        <p className="mt-1 text-xs text-primary-mid">
          {hasCoordinates
            ? "The interactive map on the public page uses this society's saved location. Upload a master-plan PDF below to also show a download button."
            : "This society has no saved location yet, so the interactive map won't show on the public page — a PDF here will still display as a download."}
        </p>

        <input
          ref={mapFileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleMapFile(file);
            event.target.value = "";
          }}
        />

        {mapPdfUrl ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-secondary bg-white p-3">
            <span className="text-sm font-semibold text-black">✓ Map PDF uploaded</span>
            <a href={mapPdfUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
              View
            </a>
            <button
              type="button"
              disabled={isUploadingMap}
              onClick={() => mapFileInputRef.current?.click()}
              className="ml-auto cursor-pointer text-xs text-primary-mid underline disabled:opacity-60"
            >
              {isUploadingMap ? "Uploading..." : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => setMapPdfUrl("")}
              className="cursor-pointer text-xs text-primary-mid underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isUploadingMap}
            onClick={() => mapFileInputRef.current?.click()}
            className="mt-3 w-full cursor-pointer rounded-lg border-2 border-dashed border-primary p-4 text-center text-sm font-semibold text-black disabled:opacity-60"
          >
            {isUploadingMap ? "Uploading..." : "Upload Map PDF"}
          </button>
        )}

        {mapUploadError && (
          <p className="mt-2 text-sm font-medium text-black">
            <span aria-hidden="true">⚠ </span>
            {mapUploadError}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">SEO</h2>
        <label className="mt-3 block text-xs font-semibold text-primary-mid">Meta Title</label>
        <input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} className={`${inputClass} mt-1`} />
        <label className="mt-3 block text-xs font-semibold text-primary-mid">Meta Description</label>
        <textarea
          value={metaDesc}
          onChange={(event) => setMetaDesc(event.target.value)}
          rows={2}
          className={`${inputClass} mt-1`}
        />
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-primary bg-white py-4">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        {savedMessage && <span className="text-sm font-semibold text-primary">✓ Guide saved</span>}
        {hasExistingGuide && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleDelete()}
            className="ml-auto text-sm text-primary-mid underline disabled:opacity-60"
          >
            Delete guide
          </button>
        )}
      </div>
    </div>
  );
}
