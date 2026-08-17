import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { MediaGrid, type MediaItem } from "@/components/admin/MediaGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Media Library | ZProperty Admin" };

const FOLDER_TABS = ["all", "listings", "blog", "projects", "general"] as const;
type FolderFilter = (typeof FOLDER_TABS)[number];

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder: folderParam } = await searchParams;
  const folder: FolderFilter = FOLDER_TABS.includes(folderParam as FolderFilter)
    ? (folderParam as FolderFilter)
    : "all";

  const admin = createAdminClient();

  let query = admin
    .from("media_library")
    .select("id, url, thumb_url, file_size_kb, width, height, folder")
    .order("created_at", { ascending: false })
    .limit(100);

  if (folder !== "all") {
    query = query.eq("folder", folder);
  }

  const { data } = await query;

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Media Library</h1>

      <div className="mb-2 mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-white p-4">
        {FOLDER_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/media" : `/admin/media?folder=${tab}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              folder === tab ? "bg-secondary text-primary" : "border border-primary text-primary"
            }`}
          >
            {tab}
          </Link>
        ))}
      </div>

      <MediaGrid items={(data ?? []) as MediaItem[]} />
    </div>
  );
}
