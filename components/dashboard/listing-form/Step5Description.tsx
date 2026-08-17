"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Pilcrow } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Step1Data, Step2Data, Step3Data, Step5Data } from "@/app/dashboard/listings/schemas";
import { inputClass, labelClass, errorClass, TYPE_LABELS } from "./styles";

function youtubeThumbnail(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  const id = watchMatch?.[1] ?? shortMatch?.[1];
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

export function Step5Description({
  data,
  errors,
  context,
  onChange,
}: {
  data: Partial<Step5Data>;
  errors: Record<string, string>;
  context: { step1: Partial<Step1Data>; step2: Partial<Step2Data>; step3: Partial<Step3Data> };
  onChange: (data: Partial<Step5Data>) => void;
}) {
  const [areaName, setAreaName] = useState<string | null>(null);
  const [plainLength, setPlainLength] = useState((data.description ?? "").length);

  // Render-time reset (see Step2Location.tsx for the same pattern) — clearing
  // the stale name when the area disappears is derived state, not a fetch.
  const [prevAreaId, setPrevAreaId] = useState(context.step2.area_id);
  if (context.step2.area_id !== prevAreaId) {
    setPrevAreaId(context.step2.area_id);
    if (!context.step2.area_id && areaName !== null) setAreaName(null);
  }

  useEffect(() => {
    const areaId = context.step2.area_id;
    if (!areaId) return;

    const supabase = createClient();
    let active = true;

    supabase
      .from("areas")
      .select("name")
      .eq("id", areaId)
      .single()
      .then(({ data: row }) => {
        if (active) setAreaName((row?.name as string | undefined) ?? null);
      });

    return () => {
      active = false;
    };
  }, [context.step2.area_id]);

  // Pre-fill the contact fields from the agent's own profile once, only for
  // a brand-new listing (both fields still `undefined`, not `null` — the
  // edit form initializes them from the listing row itself, where `null`
  // means "deliberately left blank," and re-filling that would clobber it).
  useEffect(() => {
    if (data.contact_phone !== undefined || data.contact_whatsapp !== undefined) return;

    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || !active) return;
      const [{ data: userRow }, { data: profileRow }] = await Promise.all([
        supabase.from("users").select("phone").eq("id", user.id).single(),
        supabase.from("agent_profiles").select("whatsapp").eq("user_id", user.id).single(),
      ]);
      if (!active) return;
      onChange({
        contact_phone: (userRow?.phone as string | null) ?? "",
        contact_whatsapp: (profileRow?.whatsapp as string | null) ?? "",
      });
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount, guarded by the undefined check above
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content: data.description ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => {
      onChange({ description: instance.getHTML() });
      setPlainLength(instance.getText().length);
    },
  });

  const { purpose, type } = context.step1;
  const beds = context.step3.beds;
  const suggestedTitle =
    purpose && type
      ? `${beds ? `${beds} Bed ` : ""}${TYPE_LABELS[type]} for ${purpose === "buy" ? "Sale" : "Rent"}${
          areaName ? ` in ${areaName}` : ""
        }`
      : null;

  const titleLength = (data.title ?? "").length;
  const videoPreview = data.video_url ? youtubeThumbnail(data.video_url) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className={labelClass}>Listing Title</label>
        <input
          value={data.title ?? ""}
          onChange={(event) => onChange({ title: event.target.value })}
          className={inputClass}
        />
        {errors.title && <p className={errorClass}>⚠ {errors.title}</p>}

        {!data.title && suggestedTitle && (
          <p className="mt-1 text-xs text-primary-mid">
            Suggested: {suggestedTitle}{" "}
            <button
              type="button"
              onClick={() => onChange({ title: suggestedTitle })}
              className="text-primary hover:underline"
            >
              [Use this suggestion]
            </button>
          </p>
        )}

        <p className={`mt-1 text-xs ${titleLength > 200 ? "font-bold text-black" : "text-primary-mid"}`}>
          {titleLength} / 200
        </p>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <div className="flex gap-2 rounded-t-lg border border-primary bg-white p-2">
          <ToolbarButton
            active={editor?.isActive("bold") ?? false}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            label="Bold"
          >
            <Bold className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("italic") ?? false}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            label="Italic"
          >
            <Italic className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("bulletList") ?? false}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            label="Bullet list"
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("orderedList") ?? false}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            label="Numbered list"
          >
            <ListOrdered className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("paragraph") ?? false}
            onClick={() => editor?.chain().focus().setParagraph().run()}
            label="Paragraph"
          >
            <Pilcrow className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
        </div>
        <EditorContent
          editor={editor}
          className="min-h-[150px] rounded-b-lg border border-t-0 border-primary p-3 text-sm text-black focus:outline-none"
        />
        {errors.description && <p className={errorClass}>⚠ {errors.description}</p>}
        <p className="mt-1 text-xs text-primary-mid">{plainLength} / 2000</p>
      </div>

      <div>
        <label className={labelClass}>Video URL (optional)</label>
        <input
          value={data.video_url ?? ""}
          onChange={(event) => onChange({ video_url: event.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className={inputClass}
        />
        {errors.video_url && <p className={errorClass}>⚠ {errors.video_url}</p>}
        {videoPreview && (
          // eslint-disable-next-line @next/next/no-img-element -- external youtube.com thumbnail, not in next.config.ts's remotePatterns
          <img
            src={videoPreview}
            alt="Video preview"
            className="mt-2 h-24 w-40 rounded-lg border border-primary object-cover"
          />
        )}
      </div>

      <div>
        <label className={labelClass}>Contact for this listing</label>
        <p className="mb-2 text-xs text-primary-mid">
          Buyers will call/WhatsApp these numbers for this specific listing — defaults to your profile,
          but you can enter a different number (e.g. the plot owner&apos;s) if this listing isn&apos;t yours.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-primary-mid">Call number</label>
            <input
              value={data.contact_phone ?? ""}
              onChange={(event) => onChange({ contact_phone: event.target.value })}
              placeholder="03001234567"
              className={inputClass}
            />
            {errors.contact_phone && <p className={errorClass}>⚠ {errors.contact_phone}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs text-primary-mid">WhatsApp number</label>
            <input
              value={data.contact_whatsapp ?? ""}
              onChange={(event) => onChange({ contact_whatsapp: event.target.value })}
              placeholder="03001234567"
              className={inputClass}
            />
            {errors.contact_whatsapp && <p className={errorClass}>⚠ {errors.contact_whatsapp}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded p-1.5 transition ${
        active ? "bg-primary text-white" : "text-black hover:bg-primary hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
