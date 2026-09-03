"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { AgentContact } from "@/types";

const DEFAULT_MESSAGE = "Hi, I'm interested in this property. Please contact me.";

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^92/, "").replace(/^0/, "");
}

type FormStatus = "idle" | "sending" | "success" | "error";

export function AgentCard({
  agent,
  listingId,
  whatsappMessage,
  overridePhone,
  overrideWhatsapp,
}: {
  agent: AgentContact;
  listingId: string;
  whatsappMessage: string;
  // A listing-level contact override (e.g. the actual plot owner's number)
  // takes precedence over the agent's own profile contact when set.
  overridePhone?: string | null;
  overrideWhatsapp?: string | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [showEmailField, setShowEmailField] = useState(false);
  const [email, setEmail] = useState("");

  const initial = agent.name.trim().charAt(0).toUpperCase() || "A";
  const effectivePhone = overridePhone || agent.phone;
  const effectiveWhatsapp = overrideWhatsapp || agent.whatsapp;
  // Each button falls back to the other number if only one was provided —
  // better to offer a working Call button off a WhatsApp-only number than
  // to hide it entirely, and vice versa.
  const cleanedCallNumber = effectivePhone
    ? cleanPhone(effectivePhone)
    : effectiveWhatsapp
      ? cleanPhone(effectiveWhatsapp)
      : null;
  const cleanedWhatsapp = effectiveWhatsapp
    ? cleanPhone(effectiveWhatsapp)
    : effectivePhone
      ? cleanPhone(effectivePhone)
      : null;

  function postLead(type: "whatsapp" | "call" | "email", extra?: Record<string, string>) {
    fetch(`/api/listings/${listingId}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name, phone, message, ...extra }),
      keepalive: true,
      // Best-effort tracking ping — never let a failure here block the
      // actual WhatsApp/call/email action the button already started.
    }).catch(() => {});
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch(`/api/listings/${listingId}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "form", name, phone, message }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="sticky top-24 rounded-xl border-2 border-primary bg-white p-5">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-secondary">
        {initial}
      </div>
      <p className="mt-3 text-base font-bold text-black">{agent.name}</p>
      {agent.headline && <p className="mt-0.5 text-xs text-primary-mid">{agent.headline}</p>}
      {agent.cnic_verified && (
        <span className="mt-1 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-secondary">
          ✓ CNIC Verified
        </span>
      )}
      {!!agent.experience_years && (
        <p className="mt-1 text-xs text-primary-mid">{agent.experience_years} years experience</p>
      )}
      <Link href={`/agents/${agent.profile_slug}`} className="mt-2 block text-xs text-primary underline">
        View full profile →
      </Link>

      <div className="my-4 border-t border-primary" />

      {status === "success" ? (
        <div className="rounded-lg bg-secondary p-3 text-center text-sm font-semibold text-primary">
          ✓ Enquiry sent! The agent will contact you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="mb-3 text-sm font-semibold text-black">Send an enquiry</p>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black placeholder:text-primary-mid"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Your phone number"
            className="mt-2 w-full rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black placeholder:text-primary-mid"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            className="mt-2 w-full resize-none rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black placeholder:text-primary-mid"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-mid disabled:opacity-70"
          >
            {status === "sending" ? "Sending..." : "Send Enquiry"}
          </button>
          {status === "error" && (
            <p className="mt-1 text-xs text-black">⚠ Failed to send. Please try WhatsApp below.</p>
          )}
        </form>
      )}

      <div className="my-4 border-t border-primary" />

      {cleanedWhatsapp && (
        <a
          href={`https://wa.me/92${cleanedWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => postLead("whatsapp")}
          className="mt-1 block w-full rounded-lg bg-secondary py-3 text-center text-sm font-bold text-primary"
        >
          💬 WhatsApp
        </a>
      )}

      {cleanedCallNumber && (
        <a
          href={`tel:+92${cleanedCallNumber}`}
          onClick={() => postLead("call")}
          className="mt-2 block w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white"
        >
          📞 Call Agent
        </a>
      )}

      {showEmailField ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            postLead("email", { email });
          }}
          className="mt-2 flex gap-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-primary bg-white px-3 py-2 text-sm text-black placeholder:text-primary-mid"
          />
          <button
            type="submit"
            className="rounded-lg border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary"
          >
            Send
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setShowEmailField(true);
            postLead("email");
          }}
          className="mt-2 w-full rounded-lg border border-primary bg-white py-3 text-sm font-semibold text-primary"
        >
          ✉ Email
        </button>
      )}
    </div>
  );
}
