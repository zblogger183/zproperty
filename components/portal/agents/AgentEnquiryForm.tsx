"use client";

import { useState, type FormEvent } from "react";

const DEFAULT_MESSAGE = "Hi, I'm interested in your listings. Please contact me.";

type FormStatus = "idle" | "sending" | "success" | "error";

export function AgentEnquiryForm({ agentId }: { agentId: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("/api/leads/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, name, phone, message }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg bg-secondary p-3 text-center text-sm font-semibold text-primary">
        ✓ Message sent!
      </div>
    );
  }

  return (
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
        <p className="mt-1 text-xs text-black">⚠ Failed to send. Please try again.</p>
      )}
    </form>
  );
}
