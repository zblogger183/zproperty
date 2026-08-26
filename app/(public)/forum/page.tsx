import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createPublicClient } from "@/lib/supabase/public";
import { ForumCategoryTabs } from "@/components/portal/forum/ForumCategoryTabs";
import { FORUM_CATEGORIES } from "@/lib/constants/forumCategories";

export const revalidate = 900;

const FORUM_TITLE = "Real Estate Forum Pakistan | ZProperty";
const FORUM_DESC =
  "Ask questions, share experiences, and get advice on buying, renting, and investing in property in Pakistan.";

// A city/category filter that matches zero topics renders the exact same
// empty state (and hence the same title/description/body) as every other
// empty filter combination — duplicate, near-zero-content pages Google
// would otherwise index once crawled. noindex only the filtered, empty
// case (same convention as /buy's searchMeta noIndex) — the base /forum
// hub page stays indexable regardless of total topic count.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string }>;
}): Promise<Metadata> {
  const { category: categoryFilter, city: cityFilter } = await searchParams;

  if (!categoryFilter && !cityFilter) {
    return { title: FORUM_TITLE, description: FORUM_DESC };
  }

  const supabase = createPublicClient();
  let query = supabase.from("forum_topics").select("id", { count: "exact", head: true });
  if (categoryFilter) query = query.eq("category", categoryFilter);
  if (cityFilter) query = query.eq("city_id", cityFilter);
  const { count } = await query;

  return {
    title: FORUM_TITLE,
    description: FORUM_DESC,
    robots: count === 0 ? { index: false, follow: true } : undefined,
  };
}

interface ForumTopicRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  body: string;
  views_count: number;
  reply_count: number;
  last_reply: string | null;
  created_at: string;
  is_pinned: boolean;
  city_id: string | null;
  city: { name: string; slug: string } | null;
  user: { name: string } | null;
}

function excerpt(body: string, length = 100): string {
  const plain = body.replace(/[#*_`>[\]()]/g, "").trim();
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string }>;
}) {
  const { category: categoryFilter, city: cityFilter } = await searchParams;
  const supabase = createPublicClient();

  const [{ data: topicsRaw }, { data: cities }] = await Promise.all([
    supabase
      .from("forum_topics")
      .select(
        `id, title, slug, category, body, views_count, reply_count, last_reply, created_at, is_pinned, city_id,
         city:cities(name, slug), user:users(name)`,
      )
      .order("is_pinned", { ascending: false })
      .order("last_reply", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("cities").select("id, name, slug").eq("is_active", true).order("display_order").limit(6),
  ]);

  let topics = (topicsRaw ?? []) as unknown as ForumTopicRow[];

  if (categoryFilter) {
    topics = topics.filter((topic) => topic.category === categoryFilter);
  }
  if (cityFilter) {
    topics = topics.filter((topic) => topic.city_id === cityFilter);
  }

  const categoryCounts = new Map<string, number>();
  for (const topic of (topicsRaw ?? []) as unknown as ForumTopicRow[]) {
    categoryCounts.set(topic.category, (categoryCounts.get(topic.category) ?? 0) + 1);
  }

  return (
    <>
      <div className="bg-primary py-8 text-center">
        <h1 className="text-2xl font-bold text-white">Property Forum</h1>
        <p className="mt-1 text-base text-white/70">Ask questions, share experiences, get advice</p>
      </div>

      <div className="sticky top-14 z-30">
        <Suspense fallback={<div className="h-[57px] border-b border-primary bg-white" />}>
          <ForumCategoryTabs />
        </Suspense>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-black">{topics.length} topics</p>
            <Link
              href="/login"
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary hover:bg-secondary-dark"
            >
              Ask a Question
            </Link>
          </div>

          {topics.length === 0 ? (
            <div className="py-12 text-center text-primary-mid">
              No discussions yet. Be the first to ask a question!
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/forum/${topic.category}/${topic.slug}`}
                  className="block rounded-xl border border-primary bg-white p-4 transition hover:border-secondary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {topic.is_pinned && (
                        <span className="mb-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
                          📌 Pinned
                        </span>
                      )}
                      <p className="line-clamp-2 text-base font-semibold text-black">{topic.title}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-primary-mid">{excerpt(topic.body)}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] capitalize text-white">
                        {topic.category}
                      </span>
                      {topic.city && <p className="mt-1 text-[10px] text-primary-mid">{topic.city.name}</p>}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-primary-mid">
                    <span>By {topic.user?.name ?? "Member"}</span>
                    <span>· {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                    <span>· {topic.reply_count} replies</span>
                    <span>· {topic.views_count} views</span>
                    {topic.last_reply && (
                      <span>· Last reply {formatDistanceToNow(new Date(topic.last_reply), { addSuffix: true })}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="rounded-xl border border-primary bg-white p-5">
            <p className="text-lg font-bold text-black">{(topicsRaw ?? []).length} total discussions</p>
          </div>

          <div className="mt-4 rounded-xl border border-primary bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-black">Browse by Category</p>
            <div className="space-y-1">
              {FORUM_CATEGORIES.filter((category) => category.value).map((category) => (
                <Link
                  key={category.value}
                  href={`/forum?category=${category.value}`}
                  className="flex items-center justify-between py-1.5 text-sm text-primary hover:text-primary-mid"
                >
                  <span>{category.label}</span>
                  <span className="text-xs text-primary-mid">{categoryCounts.get(category.value) ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>

          {!!cities?.length && (
            <div className="mt-4 rounded-xl border border-primary bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-black">Browse by City</p>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <Link
                    key={city.id}
                    href={`/forum?city=${city.id}`}
                    className="rounded-full border border-primary bg-white px-3 py-1 text-xs text-primary hover:border-secondary"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
