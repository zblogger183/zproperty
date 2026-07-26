"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/styles";
import { saveHomepageSettingsAction } from "@/app/admin/content/homepage/actions";

export function HomepageSectionsEditor({
  initialSettings,
}: {
  initialSettings: Record<string, string | boolean>;
}) {
  const [heroHeadline, setHeroHeadline] = useState(String(initialSettings.hero_headline ?? ""));
  const [heroSubheadline, setHeroSubheadline] = useState(String(initialSettings.hero_subheadline ?? ""));
  const [statsListings, setStatsListings] = useState(String(initialSettings.stats_listings ?? ""));
  const [statsAgents, setStatsAgents] = useState(String(initialSettings.stats_agents ?? ""));
  const [statsCities, setStatsCities] = useState(String(initialSettings.stats_cities ?? ""));
  const [statsUsers, setStatsUsers] = useState(String(initialSettings.stats_users ?? ""));
  const [announcementText, setAnnouncementText] = useState(String(initialSettings.announcement_text ?? ""));
  const [announcementLink, setAnnouncementLink] = useState(String(initialSettings.announcement_link ?? ""));
  const [announcementActive, setAnnouncementActive] = useState(Boolean(initialSettings.announcement_active));
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSavedMessage(false);

    try {
      await saveHomepageSettingsAction({
        hero_headline: heroHeadline,
        hero_subheadline: heroSubheadline,
        stats_listings: statsListings,
        stats_agents: statsAgents,
        stats_cities: statsCities,
        stats_users: statsUsers,
        announcement_text: announcementText,
        announcement_link: announcementLink,
        announcement_active: announcementActive,
      });
      setSavedMessage(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save homepage settings.");
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
        <h2 className="text-base font-bold text-black">Hero Text</h2>

        <label className="mt-4 block text-xs font-semibold text-primary-mid" htmlFor="heroHeadline">
          Headline
        </label>
        <input
          id="heroHeadline"
          value={heroHeadline}
          onChange={(event) => setHeroHeadline(event.target.value)}
          className={`${inputClass} mt-1`}
        />

        <label className="mt-3 block text-xs font-semibold text-primary-mid" htmlFor="heroSubheadline">
          Subheadline
        </label>
        <input
          id="heroSubheadline"
          value={heroSubheadline}
          onChange={(event) => setHeroSubheadline(event.target.value)}
          className={`${inputClass} mt-1`}
        />

        <div className="mt-4 rounded-lg bg-primary p-6 text-center">
          <p className="text-lg font-bold text-white">{heroHeadline || "Headline preview"}</p>
          <p className="mt-1 text-sm text-secondary">{heroSubheadline || "Subheadline preview"}</p>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <h2 className="text-base font-bold text-black">Stats Bar</h2>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-primary-mid" htmlFor="statsListings">
              Listings
            </label>
            <input
              id="statsListings"
              value={statsListings}
              onChange={(event) => setStatsListings(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-mid" htmlFor="statsAgents">
              Agents
            </label>
            <input
              id="statsAgents"
              value={statsAgents}
              onChange={(event) => setStatsAgents(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-mid" htmlFor="statsCities">
              Cities
            </label>
            <input
              id="statsCities"
              value={statsCities}
              onChange={(event) => setStatsCities(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-primary-mid" htmlFor="statsUsers">
              Users
            </label>
            <input
              id="statsUsers"
              value={statsUsers}
              onChange={(event) => setStatsUsers(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-black">Announcement Banner</h2>
          <button
            type="button"
            role="switch"
            aria-checked={announcementActive}
            onClick={() => setAnnouncementActive((value) => !value)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              announcementActive ? "bg-secondary" : "bg-primary-mid"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                announcementActive ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {announcementActive && (
          <>
            <label className="mt-4 block text-xs font-semibold text-primary-mid" htmlFor="announcementText">
              Text
            </label>
            <input
              id="announcementText"
              value={announcementText}
              onChange={(event) => setAnnouncementText(event.target.value)}
              className={`${inputClass} mt-1`}
            />

            <label className="mt-3 block text-xs font-semibold text-primary-mid" htmlFor="announcementLink">
              Link
            </label>
            <input
              id="announcementLink"
              value={announcementLink}
              onChange={(event) => setAnnouncementLink(event.target.value)}
              placeholder="/listing/... or https://..."
              className={`${inputClass} mt-1`}
            />

            {announcementText && (
              <div className="mt-4 rounded-lg bg-secondary px-4 py-2 text-center text-sm font-semibold text-primary">
                {announcementText}
              </div>
            )}
          </>
        )}
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
        {savedMessage && <span className="text-sm font-semibold text-primary">✓ Homepage updated</span>}
      </div>
    </div>
  );
}
