"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Step6Data } from "@/app/dashboard/listings/schemas";
import { errorClass, inputClass, labelClass } from "./styles";

export function SEOPanel({
  data,
  errors,
  slugPreview,
  autoTitle,
  autoDesc,
  onChange,
}: {
  data: Partial<Step6Data>;
  errors: Record<string, string>;
  slugPreview: string;
  autoTitle: string;
  autoDesc: string;
  onChange: (data: Partial<Step6Data>) => void;
}) {
  const [open, setOpen] = useState(true);

  const titleLength = (data.meta_title ?? "").length;
  const descLength = (data.meta_desc ?? "").length;
  const previewTitle = (data.meta_title || autoTitle).slice(0, 60);
  const previewDesc = (data.meta_desc || autoDesc).slice(0, 160);

  return (
    <div className="mt-6 rounded-xl border border-primary p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left font-semibold text-black"
      >
        SEO Settings (Optional)
        {open ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between">
              <label className={labelClass}>SEO Title</label>
              <button
                type="button"
                onClick={() => onChange({ meta_title: autoTitle.slice(0, 60) })}
                className="text-xs text-primary underline"
              >
                Auto-generate
              </button>
            </div>
            <input
              value={data.meta_title ?? ""}
              onChange={(event) => onChange({ meta_title: event.target.value })}
              maxLength={60}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-primary-mid">{titleLength} / 60</p>
            {errors.meta_title && <p className={errorClass}>⚠ {errors.meta_title}</p>}

            <div className="mt-2 rounded-lg border border-primary bg-white p-3">
              <p className="text-xs text-primary-mid">zproperty.pk/listing/{slugPreview}</p>
              <p className="text-sm font-medium text-primary">{previewTitle}</p>
              <p className="text-xs text-black">{previewDesc}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={labelClass}>Meta Description</label>
              <button
                type="button"
                onClick={() => onChange({ meta_desc: autoDesc.slice(0, 160) })}
                className="text-xs text-primary underline"
              >
                Auto-generate
              </button>
            </div>
            <textarea
              value={data.meta_desc ?? ""}
              onChange={(event) => onChange({ meta_desc: event.target.value })}
              rows={3}
              maxLength={160}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-primary-mid">{descLength} / 160</p>
            {errors.meta_desc && <p className={errorClass}>⚠ {errors.meta_desc}</p>}
          </div>

          <div>
            <label className={labelClass}>Focus Keyword</label>
            <input
              value={data.focus_keyword ?? ""}
              onChange={(event) => onChange({ focus_keyword: event.target.value })}
              placeholder="e.g. house for sale in DHA Lahore"
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}
