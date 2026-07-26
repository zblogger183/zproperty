import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/portal/Breadcrumb";
import { ForumReplyForm } from "@/components/portal/forum/ForumReplyForm";

export const dynamic = "force-dynamic";

interface ForumTopicDetail {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string;
  is_pinned: boolean;
  is_closed: boolean;
  views_count: number;
  reply_count: number;
  created_at: string;
  city: { name: string; slug: string } | null;
  user: { name: string } | null;
}

interface ForumReplyRow {
  id: string;
  body: string;
  is_answer: boolean;
  likes: number;
  created_at: string;
  user: { name: string } | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string; slug: string }>;
}): Promise<Metadata> {
  const { topic, slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("forum_topics")
    .select("title, body")
    .eq("slug", slug)
    .eq("category", topic)
    .maybeSingle();

  if (!data) {
    return { title: "Discussion not found | SarZameenz.com" };
  }

  return {
    title: `${data.title} | SarZameenz Forum`,
    description: data.body.slice(0, 160),
  };
}

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ topic: string; slug: string }>;
}) {
  const { topic, slug } = await params;
  const supabase = createPublicClient();

  const { data: forumTopic } = await supabase
    .from("forum_topics")
    .select(
      `id, title, slug, body, category, is_pinned, is_closed, views_count, reply_count, created_at,
       city:cities(name, slug), user:users(name)`,
    )
    .eq("slug", slug)
    .eq("category", topic)
    .single();

  if (!forumTopic) {
    notFound();
  }

  const typedTopic = forumTopic as unknown as ForumTopicDetail;

  // Fire-and-forget view increment — must not block or fail the render.
  const admin = createAdminClient();
  void admin
    .from("forum_topics")
    .update({ views_count: typedTopic.views_count + 1 })
    .eq("id", typedTopic.id)
    .then(() => {});

  const { data: repliesRaw } = await supabase
    .from("forum_replies")
    .select("id, body, is_answer, likes, created_at, user:users(name)")
    .eq("topic_id", typedTopic.id)
    .order("is_answer", { ascending: false })
    .order("created_at", { ascending: true });

  const replies = (repliesRaw ?? []) as unknown as ForumReplyRow[];

  const authSupabase = await createClient();
  const {
    data: { session },
  } = await authSupabase.auth.getSession();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Forum", href: "/forum" },
    { label: typedTopic.category, href: `/forum?category=${typedTopic.category}` },
    { label: typedTopic.title.slice(0, 40) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {/* Breadcrumb already emits its own BreadcrumbList JSON-LD. */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="mt-6 rounded-xl border-2 border-primary bg-white p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-secondary">
            {(typedTopic.user?.name ?? "M").charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-black">{typedTopic.user?.name ?? "Community Member"}</p>
            <p className="text-xs text-primary-mid">
              Posted {formatDistanceToNow(new Date(typedTopic.created_at), { addSuffix: true })} ago
            </p>
          </div>
        </div>

        <h1 className="mt-4 text-xl font-bold text-black">{typedTopic.title}</h1>
        <span className="mt-2 inline-block rounded-full bg-primary px-2 py-0.5 text-xs capitalize text-white">
          {typedTopic.category}
        </span>
        {typedTopic.city && (
          <span className="ml-2 inline-block rounded-full border border-primary px-2 py-0.5 text-xs text-primary">
            {typedTopic.city.name}
          </span>
        )}

        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-black">{typedTopic.body}</p>

        <div className="mt-4 flex gap-4 border-t border-primary pt-4 text-xs text-primary-mid">
          <span>{typedTopic.reply_count} replies</span>
          <span>· {typedTopic.views_count} views</span>
        </div>

        {typedTopic.is_closed && (
          <div className="mt-4 rounded-lg bg-primary p-3 text-sm text-white">This discussion has been closed.</div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-black">{typedTopic.reply_count} Replies</h2>

        {replies.map((reply) => (
          <div
            key={reply.id}
            className={`mb-3 rounded-xl border bg-white p-4 ${
              reply.is_answer ? "border-2 border-secondary" : "border-primary"
            }`}
          >
            {reply.is_answer && (
              <span className="mb-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
                ✓ Best Answer
              </span>
            )}
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-secondary">
                {(reply.user?.name ?? "M").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-black">{reply.user?.name ?? "Community Member"}</p>
                <p className="text-xs text-primary-mid">
                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-black">{reply.body}</p>
            <p className="mt-3 text-xs text-primary-mid">{reply.likes} likes</p>
          </div>
        ))}
      </div>

      {!typedTopic.is_closed && (
        <div className="mt-8 rounded-xl border border-primary bg-white p-5">
          <p className="mb-4 text-base font-semibold text-black">Add Your Reply</p>
          {session ? (
            <ForumReplyForm topicId={typedTopic.id} />
          ) : (
            <p className="text-sm text-primary-mid">
              <Link href="/login" className="font-semibold text-primary underline">
                Sign in
              </Link>{" "}
              to post a reply
            </p>
          )}
        </div>
      )}
    </div>
  );
}
