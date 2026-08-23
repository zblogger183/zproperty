"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, FileText, Mail, MessageCircle, Phone } from "lucide-react";
import { addLeadNoteAction, updateLeadStatusAction } from "@/app/dashboard/leads/actions";

export interface LeadNote {
  id: string;
  note: string;
  created_at: string;
}

export interface LeadWithDetails {
  id: string;
  lead_type: "call" | "whatsapp" | "email" | "form";
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string;
  created_at: string;
  listing: {
    id: string;
    slug: string;
    title: string;
    purpose: string;
    type: string;
    primary_image_url: string | null;
    price: number;
  } | null;
  project?: {
    id: string;
    slug: string;
    name: string;
    cover_image_url: string | null;
  } | null;
  notes: LeadNote[];
}

const LEAD_TYPE_STYLES: Record<LeadWithDetails["lead_type"], { className: string; Icon: typeof Phone }> = {
  call: { className: "bg-primary text-white", Icon: Phone },
  whatsapp: { className: "bg-secondary text-primary", Icon: MessageCircle },
  email: { className: "bg-primary-mid text-white", Icon: Mail },
  form: { className: "border-2 border-primary bg-white text-primary", Icon: FileText },
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  new: "bg-secondary text-primary font-bold",
  contacted: "bg-primary-mid text-white",
  viewing: "bg-primary text-white",
  negotiating: "bg-primary text-secondary",
  won: "bg-secondary text-primary font-bold",
  lost: "border border-primary bg-white text-primary-mid",
  spam: "border border-primary bg-white text-primary-mid",
};

const STATUS_OPTIONS = ["new", "contacted", "viewing", "negotiating", "won", "lost", "spam"];

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^92/, "").replace(/^0/, "");
}

export function LeadCard({ lead }: { lead: LeadWithDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(lead.notes);
  const [status, setStatus] = useState(lead.status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { className, Icon } = LEAD_TYPE_STYLES[lead.lead_type];
  const cleanedPhone = lead.phone ? cleanPhone(lead.phone) : null;

  function handleStatusChange(newStatus: string) {
    const previousStatus = status;
    setStatus(newStatus);
    setError(null);

    startTransition(async () => {
      try {
        await updateLeadStatusAction(lead.id, newStatus);
      } catch {
        setStatus(previousStatus);
        setError("⚠ Failed to update");
      }
    });
  }

  async function handleSaveNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    try {
      const inserted = await addLeadNoteAction(lead.id, trimmed);
      setNotes((prev) => [inserted, ...prev]);
      setNoteText("");
      setShowNoteInput(false);
    } catch {
      setError("⚠ Failed to save note");
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-primary bg-white">
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <p className="truncate text-sm font-semibold text-black">{lead.name ?? "Anonymous"}</p>
            <span className="ml-auto shrink-0 text-xs text-primary-mid">
              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary-mid">
            {(lead.phone || lead.email) && <span>{lead.phone ?? lead.email}</span>}
            {lead.listing && <span className="truncate text-primary">{lead.listing.title}</span>}
            {lead.project && <span className="truncate text-primary">{lead.project.name}</span>}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] capitalize ${
            STATUS_BADGE_CLASSES[status] ?? "border border-primary text-primary-mid"
          }`}
        >
          {status}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-primary-mid transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div className="border-t border-primary">
          {lead.message && (
            <div className="px-4 py-3">
              <p className="mb-1 text-xs text-primary-mid">Message:</p>
              <p className="text-sm italic text-black">{lead.message}</p>
            </div>
          )}

          {lead.listing && (
            <div className="flex items-center gap-3 border-t border-primary px-4 py-3">
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-primary">
                {lead.listing.primary_image_url && (
                  <Image src={lead.listing.primary_image_url} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-primary-mid">Re:</p>
                <Link
                  href={`/listing/${lead.listing.slug}`}
                  className="block truncate text-sm font-medium text-black hover:underline"
                >
                  {lead.listing.title}
                </Link>
              </div>
            </div>
          )}

          {lead.project && (
            <div className="flex items-center gap-3 border-t border-primary px-4 py-3">
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-primary">
                {lead.project.cover_image_url && (
                  <Image src={lead.project.cover_image_url} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-primary-mid">Re:</p>
                <Link
                  href={`/new-projects/${lead.project.slug}`}
                  className="block truncate text-sm font-medium text-black hover:underline"
                >
                  {lead.project.name}
                </Link>
              </div>
            </div>
          )}

          <div className="border-t border-primary px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-black">Notes</p>
            {notes.map((note) => (
              <div key={note.id} className="mb-2 border-l-2 border-secondary bg-white pl-2 text-xs text-black">
                <p>{note.note}</p>
                <p className="text-[10px] text-primary-mid">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}

            {showNoteInput ? (
              <div>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={2}
                  placeholder="Add a note..."
                  className="w-full rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black placeholder:text-primary-mid"
                />
                <button
                  type="button"
                  onClick={() => void handleSaveNote()}
                  className="mt-1 rounded-lg bg-primary px-3 py-1.5 text-xs text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteInput(false);
                    setNoteText("");
                  }}
                  className="ml-2 text-xs text-primary-mid"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowNoteInput(true)} className="text-xs text-primary underline">
                + Add note
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-primary bg-white px-4 py-3">
            <select
              value={status}
              disabled={isPending}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="rounded-lg border border-primary bg-white px-2 py-1.5 text-xs text-black"
              aria-label="Lead status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {cleanedPhone && (
              <a href={`tel:+92${cleanedPhone}`} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white">
                📞 Call
              </a>
            )}
            {cleanedPhone && (
              <a
                href={`https://wa.me/92${cleanedPhone}?text=${encodeURIComponent("Hi, thanks for your enquiry!")}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-primary"
              >
                💬 WhatsApp
              </a>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleStatusChange("spam")}
              className="ml-auto text-xs text-primary-mid underline"
            >
              🗑 Mark as spam
            </button>
          </div>
          {error && <p className="px-4 pb-3 text-xs font-medium text-black">{error}</p>}
        </div>
      )}
    </div>
  );
}
