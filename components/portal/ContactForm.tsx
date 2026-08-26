"use client";

import { useState, type FormEvent } from "react";

const SUBJECTS = [
  "General Enquiry",
  "List a Property",
  "Partnership",
  "Advertising",
  "Technical Issue",
];

type FormStatus = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
      setName("");
      setEmail("");
      setSubject(SUBJECTS[0]);
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg bg-secondary p-3 text-center font-semibold text-primary">
        ✓ Message sent! We&apos;ll reply within 24 hours.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-primary bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-black">Send Us a Message</h2>
      <div>
        <label className="block text-sm font-semibold text-black" htmlFor="contact-name">
          Name
        </label>
        <input
          id="contact-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black" htmlFor="contact-email">
          Email or Phone
        </label>
        <input
          id="contact-email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black" htmlFor="contact-subject">
          Subject
        </label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="mt-1 w-full rounded-lg border border-primary bg-white px-3 py-2.5 text-sm text-black"
        >
          {SUBJECTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 w-full resize-none rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 w-full rounded-lg bg-secondary py-3 text-sm font-bold text-primary hover:bg-secondary-dark disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
      {status === "error" && <p className="mt-2 text-xs text-black">⚠ Failed to send. Please try again.</p>}
    </form>
  );
}
