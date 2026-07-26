"use client";

export interface SEOFields {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
}

export function SEOPanel({
  value,
  onChange,
}: {
  value: SEOFields;
  onChange: (value: SEOFields) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-secondary p-4">
      <label className="flex flex-col gap-1 text-sm text-text">
        Meta title
        <input
          value={value.metaTitle}
          onChange={(event) => onChange({ ...value, metaTitle: event.target.value })}
          className="rounded-md border border-secondary bg-bg px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        Meta description
        <textarea
          value={value.metaDescription}
          onChange={(event) => onChange({ ...value, metaDescription: event.target.value })}
          rows={3}
          className="rounded-md border border-secondary bg-bg px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text">
        Canonical URL
        <input
          value={value.canonicalUrl}
          onChange={(event) => onChange({ ...value, canonicalUrl: event.target.value })}
          className="rounded-md border border-secondary bg-bg px-3 py-2"
        />
      </label>
    </div>
  );
}
