"use client";

import { useState } from "react";

export function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  async function handleCopy() {
    // Reads the live URL at click time (covers any query string/fragment)
    // rather than the `url` prop, which is only the canonical page URL.
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-8 border-t border-primary pt-6">
      <p className="mb-3 text-sm font-semibold text-black">Share this article:</p>
      <div className="flex gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-lg border border-primary bg-white px-4 py-2 text-sm text-primary"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
