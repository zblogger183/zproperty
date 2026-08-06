"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { togglePinTopicAction, toggleCloseTopicAction, deleteTopicAction } from "@/app/admin/forum/actions";

export interface ForumTopicRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  is_pinned: boolean;
  is_closed: boolean;
  views_count: number;
  reply_count: number;
  created_at: string;
  user: { name: string } | null;
}

export function ForumModerationRow({ topic }: { topic: ForumTopicRow }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setIsPending(true);
    try {
      await action();
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${topic.title}" and all its replies? This cannot be undone.`)) return;
    void run(() => deleteTopicAction(topic.id));
  }

  return (
    <tr className="border-b border-primary hover:bg-secondary/5">
      <td className="max-w-[260px] px-4 py-3">
        <Link
          href={`/forum/${topic.category}/${topic.slug}`}
          target="_blank"
          className="line-clamp-1 text-sm font-medium text-black hover:underline"
        >
          {topic.is_pinned && <span className="mr-1">📌</span>}
          {topic.title}
        </Link>
        <p className="mt-0.5 text-xs text-primary-mid">by {topic.user?.name ?? "Unknown"}</p>
      </td>
      <td className="px-4 py-3 text-xs capitalize text-primary-mid">{topic.category}</td>
      <td className="px-4 py-3 text-sm text-black">{topic.views_count}</td>
      <td className="px-4 py-3 text-sm text-black">{topic.reply_count}</td>
      <td className="px-4 py-3 text-xs text-primary-mid">
        {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
      </td>
      <td className="px-4 py-3">
        {topic.is_closed && (
          <span className="rounded-full border border-primary bg-white px-2 py-0.5 text-[10px] text-primary-mid">
            Closed
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            disabled={isPending}
            onClick={() => void run(() => togglePinTopicAction(topic.id, !topic.is_pinned))}
            className="font-semibold text-primary underline disabled:opacity-60"
          >
            {topic.is_pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => void run(() => toggleCloseTopicAction(topic.id, !topic.is_closed))}
            className="font-semibold text-primary underline disabled:opacity-60"
          >
            {topic.is_closed ? "Reopen" : "Close"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="font-semibold text-primary underline disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
