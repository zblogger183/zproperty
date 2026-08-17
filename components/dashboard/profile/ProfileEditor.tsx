"use client";

import { useState } from "react";
import Image from "next/image";
import { AGENT_SPECIALTIES } from "@/lib/constants/agentSpecialties";
import { updateAgentProfileAction } from "@/app/dashboard/profile/actions";

const LANGUAGE_OPTIONS = ["Urdu", "English", "Punjabi", "Sindhi", "Pashto", "Other"];

const inputClass =
  "w-full border border-primary rounded-lg px-3 py-2.5 text-sm text-black bg-white placeholder:text-primary-mid focus:outline-none focus:border-secondary focus:border-2";

export interface EditableProfile {
  profile_slug: string;
  headline: string | null;
  bio: string | null;
  whatsapp: string | null;
  specialties: string[] | null;
  cities_served: string[] | null;
  languages: string[] | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  experience_years: number | null;
  user: { name: string | null; avatar_url: string | null } | null;
}

export function ProfileEditor({
  profile,
  cities,
}: {
  profile: EditableProfile;
  cities: { id: string; name: string; slug: string }[];
}) {
  const [name, setName] = useState(profile.user?.name ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [specialties, setSpecialties] = useState<string[]>(profile.specialties ?? []);
  const [citiesServed, setCitiesServed] = useState<string[]>(profile.cities_served ?? []);
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const [facebookUrl, setFacebookUrl] = useState(profile.facebook_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(profile.instagram_url ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(profile.youtube_url ?? "");
  const [experienceYears, setExperienceYears] = useState(profile.experience_years ?? 0);
  const [avatarUrl, setAvatarUrl] = useState(profile.user?.avatar_url ?? null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const initial = name.trim().charAt(0).toUpperCase() || profile.profile_slug.charAt(0).toUpperCase();

  function toggleChip(value: string, list: string[], setList: (next: string[]) => void) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function handlePhotoChange(file: File) {
    setIsUploadingPhoto(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "general");

      const response = await fetch("/api/upload/image", { method: "POST", body: formData });
      const result = (await response.json()) as { large_url?: string; error?: string };

      if (!response.ok || !result.large_url) {
        throw new Error(result.error ?? "Upload failed.");
      }

      setAvatarUrl(result.large_url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveStatus("idle");
    setError(null);

    try {
      await updateAgentProfileAction({
        name,
        headline,
        bio,
        whatsapp,
        specialties,
        cities_served: citiesServed,
        languages,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        youtube_url: youtubeUrl,
        experience_years: experienceYears,
        avatar_url: avatarUrl ?? undefined,
      });
      setSaveStatus("success");
    } catch (saveError) {
      setSaveStatus("error");
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 pb-24">
      <div>
        <h1 className="text-xl font-bold text-black">Your Public Profile</h1>
        <a
          href={`/agents/${profile.profile_slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline"
        >
          zproperty.pk/agents/{profile.profile_slug}
        </a>
      </div>

      {error && (
        <p className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      <div>
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name || "Profile photo"} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-3xl font-bold text-secondary">
              {initial}
            </div>
          )}
        </div>
        <label className="mt-3 inline-block cursor-pointer rounded-lg border border-primary bg-white px-4 py-2 text-sm text-primary">
          {isUploadingPhoto ? "Uploading..." : "Change Photo"}
          <input
            type="file"
            accept="image/*"
            disabled={isUploadingPhoto}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handlePhotoChange(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="rounded-xl border border-primary bg-white p-5">
        <label className="mb-1.5 block text-sm font-semibold text-black" htmlFor="agent-name">
          Full Name
        </label>
        <input id="agent-name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        <p className="mt-1 text-xs text-primary-mid">Your name appears on all listings</p>

        <label className="mb-1.5 mt-4 block text-sm font-semibold text-black" htmlFor="agent-headline">
          Professional Headline
        </label>
        <input
          id="agent-headline"
          value={headline}
          onChange={(event) => setHeadline(event.target.value.slice(0, 100))}
          placeholder="e.g. DHA Lahore Specialist · 10 Years Experience"
          className={inputClass}
        />
        <p className="mt-1 text-right text-xs text-primary-mid">{headline.length}/100</p>

        <label className="mb-1.5 mt-4 block text-sm font-semibold text-black" htmlFor="agent-whatsapp">
          WhatsApp Number
        </label>
        <div className="flex items-center overflow-hidden rounded-lg border border-primary">
          <span className="bg-primary px-3 py-2.5 text-sm text-white">+92</span>
          <input
            id="agent-whatsapp"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="3001234567"
            className="flex-1 px-3 py-2.5 text-sm text-black outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-primary-mid">Used for direct WhatsApp contact on your listings</p>
      </div>

      <div className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-black">About You</h2>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value.slice(0, 500))}
          rows={5}
          placeholder="Write about your experience, areas you cover, specialties..."
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-right text-xs text-primary-mid">{bio.length}/500</p>
      </div>

      <div className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black">Specialties</h2>
        <div className="grid grid-cols-3 gap-2">
          {AGENT_SPECIALTIES.map((specialty) => {
            const selected = specialties.includes(specialty.value);
            return (
              <button
                key={specialty.value}
                type="button"
                onClick={() => toggleChip(specialty.value, specialties, setSpecialties)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ${
                  selected ? "border border-primary bg-primary text-white" : "border border-primary bg-white text-black"
                }`}
              >
                {specialty.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black">Cities You Serve</h2>
        <div className="grid grid-cols-3 gap-2">
          {cities.map((city) => (
            <label key={city.id} className="flex items-center gap-2 text-sm text-black">
              <input
                type="checkbox"
                checked={citiesServed.includes(city.id)}
                onChange={() => toggleChip(city.id, citiesServed, setCitiesServed)}
                className="accent-secondary"
              />
              {city.name}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black">Languages</h2>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGE_OPTIONS.map((language) => {
            const selected = languages.includes(language);
            return (
              <button
                key={language}
                type="button"
                onClick={() => toggleChip(language, languages, setLanguages)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ${
                  selected ? "border border-primary bg-primary text-white" : "border border-primary bg-white text-black"
                }`}
              >
                {language}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-primary bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black">Social Links</h2>

        <label className="mb-1.5 block text-xs font-semibold text-primary-mid" htmlFor="agent-facebook">
          Facebook URL
        </label>
        <input
          id="agent-facebook"
          value={facebookUrl}
          onChange={(event) => setFacebookUrl(event.target.value)}
          placeholder="https://facebook.com/..."
          className={`${inputClass} mb-3`}
        />

        <label className="mb-1.5 block text-xs font-semibold text-primary-mid" htmlFor="agent-instagram">
          Instagram URL
        </label>
        <input
          id="agent-instagram"
          value={instagramUrl}
          onChange={(event) => setInstagramUrl(event.target.value)}
          placeholder="https://instagram.com/..."
          className={`${inputClass} mb-3`}
        />

        <label className="mb-1.5 block text-xs font-semibold text-primary-mid" htmlFor="agent-youtube">
          YouTube URL
        </label>
        <input
          id="agent-youtube"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          placeholder="https://youtube.com/..."
          className={`${inputClass} mb-3`}
        />

        <label className="mb-1.5 block text-xs font-semibold text-primary-mid" htmlFor="agent-experience">
          Experience Years
        </label>
        <input
          id="agent-experience"
          type="number"
          min={0}
          max={50}
          value={experienceYears}
          onChange={(event) => setExperienceYears(Math.max(0, Math.min(50, Number(event.target.value) || 0)))}
          className={`${inputClass} w-24`}
        />
      </div>

      <div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="w-full rounded-xl bg-secondary py-3 text-base font-bold text-primary hover:bg-secondary-dark disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>

        {saveStatus === "success" && (
          <p className="mt-2 text-sm text-black">
            ✓ Profile updated!{" "}
            <a href={`/agents/${profile.profile_slug}`} target="_blank" rel="noreferrer" className="text-primary underline">
              View your profile →
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
