import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ForumModerationRow, type ForumTopicRow } from "@/components/admin/ForumModerationRow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Forum Moderation | SarZameenz Admin" };

export default async function ForumModerationPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("forum_topics")
    .select("id, title, slug, category, is_pinned, is_closed, views_count, reply_count, created_at, user:users(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const topics = (data ?? []) as unknown as ForumTopicRow[];

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Forum Moderation</h1>
        <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
          {topics.length} topics
        </span>
      </div>
      <p className="mt-1 text-sm text-primary-mid">Pin, close, or remove forum topics and their replies.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Topic</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Views</th>
              <th className="px-4 py-3 text-left font-semibold">Replies</th>
              <th className="px-4 py-3 text-left font-semibold">Posted</th>
              <th className="px-4 py-3 text-left font-semibold"></th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <ForumModerationRow key={topic.id} topic={topic} />
            ))}
          </tbody>
        </table>

        {topics.length === 0 && <p className="py-8 text-center text-sm text-primary-mid">No forum topics yet.</p>}
      </div>
    </div>
  );
}
