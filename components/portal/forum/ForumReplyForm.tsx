"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type FormStatus = "idle" | "sending" | "error";

export function ForumReplyForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("/api/forum/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId, body }),
      });

      if (!response.ok) throw new Error("Request failed");
      setBody("");
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
        placeholder="Share your thoughts or answer..."
        className="w-full resize-none rounded-lg border border-primary bg-white px-3 py-2.5 text-sm text-black placeholder:text-primary-mid"
      />
      <button
        type="submit"
        disabled={status === "sending" || body.trim().length < 10}
        className="mt-3 rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark disabled:opacity-60"
      >
        {status === "sending" ? "Posting..." : "Post Reply"}
      </button>
      {status === "error" && <p className="mt-2 text-xs text-black">⚠ Failed to post reply. Please try again.</p>}
    </form>
  );
}
