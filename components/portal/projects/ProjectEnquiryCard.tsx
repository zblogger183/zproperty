"use client";

import { useState, type FormEvent } from "react";

function cleanPhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^92/, "").replace(/^0/, "");
}

type FormStatus = "idle" | "sending" | "success" | "error";

export function ProjectEnquiryCard({
  projectId,
  projectName,
  developerName,
  developerWhatsapp,
}: {
  projectId: string;
  projectName: string;
  developerName: string | null;
  developerWhatsapp: string | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(`Please send me details about ${projectName}`);
  const [status, setStatus] = useState<FormStatus>("idle");

  const cleanedWhatsapp = developerWhatsapp ? cleanPhone(developerWhatsapp) : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch(`/api/projects/${projectId}/lead`, {
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
      <p className="mb-4 text-base font-bold text-black">Get Project Details</p>

      {status === "success" ? (
        <div className="rounded-lg bg-secondary p-3 text-center font-semibold text-primary">
          ✓ Request sent! Developer will contact you.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
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
            rows={2}
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

      {cleanedWhatsapp && (
        <a
          href={`https://wa.me/92${cleanedWhatsapp}?text=${encodeURIComponent(`Hi, I'm interested in ${projectName}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full rounded-lg bg-secondary py-3 text-center text-sm font-bold text-primary"
        >
          💬 WhatsApp Developer
        </a>
      )}

      {developerName && (
        <div className="mt-4 border-t border-primary pt-4">
          <p className="text-xs uppercase text-primary-mid">Developer</p>
          <p className="mt-2 text-sm font-bold text-black">{developerName}</p>
        </div>
      )}
    </div>
  );
}
