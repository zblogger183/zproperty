"use client";

import { useState } from "react";
import { saveRobotsTxtAction } from "@/app/admin/seo/actions";

const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /dashboard

Sitemap: https://sarzameenz.com/sitemap.xml
`;

export function RobotsEditor({ initialValue }: { initialValue: string }) {
  const [content, setContent] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function insertLine(line: string) {
    setContent((prev) => (prev.endsWith("\n") || prev === "" ? `${prev}${line}\n` : `${prev}\n${line}\n`));
    setSavedMessage(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSavedMessage(false);

    try {
      await saveRobotsTxtAction(content);
      setSavedMessage(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save robots.txt.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="rounded-xl border border-primary bg-white p-4 text-sm text-primary-mid">
        Saved here as the <code>robots_txt</code> setting. Note: no public <code>/robots.txt</code> route reads
        this value yet — wiring one up (e.g. an <code>app/robots.ts</code> handler) is a separate piece of work.
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => insertLine("Disallow: /admin")}
          className="rounded-lg border border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary"
        >
          + Disallow /admin
        </button>
        <button
          type="button"
          onClick={() => insertLine("Disallow: /api")}
          className="rounded-lg border border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary"
        >
          + Disallow /api
        </button>
        <button
          type="button"
          onClick={() => {
            setContent(DEFAULT_ROBOTS_TXT);
            setSavedMessage(false);
          }}
          className="rounded-lg border border-primary bg-white px-3 py-1.5 text-xs font-semibold text-primary"
        >
          Reset to default
        </button>
      </div>

      <textarea
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setSavedMessage(false);
        }}
        rows={20}
        spellCheck={false}
        className="mt-3 w-full rounded-lg border border-primary bg-white px-3 py-2.5 font-mono text-sm text-black focus:border-2 focus:border-secondary focus:outline-none"
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        {savedMessage && <span className="text-sm font-semibold text-primary">✓ robots.txt updated</span>}
      </div>
    </div>
  );
}
