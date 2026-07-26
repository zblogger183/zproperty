"use client";

import { useState, type FormEvent } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    // UI-only for now — no backend wired up yet.
    setSubscribed(true);
  }

  if (subscribed) {
    return <p className="text-sm font-semibold text-white">Thanks! We&apos;ll keep you updated.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="w-64 rounded-lg border border-primary-mid bg-primary px-4 py-2.5 text-sm text-white placeholder:text-white/50"
      />
      <button
        type="submit"
        className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
      >
        Subscribe
      </button>
    </form>
  );
}
