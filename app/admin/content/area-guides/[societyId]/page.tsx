import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AreaGuideEditor } from "@/components/admin/AreaGuideEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit Area Guide | ZProperty Admin" };

export default async function EditAreaGuidePage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const admin = createAdminClient();

  const [{ data: society }, { data: guide }] = await Promise.all([
    admin.from("societies").select("id, name").eq("id", societyId).single(),
    admin
      .from("area_guides")
      .select("overview, pros, cons, review_summary, meta_title, meta_desc, is_published")
      .eq("society_id", societyId)
      .maybeSingle(),
  ]);

  if (!society) notFound();

  return (
    <div className="px-6 py-6">
      <Link href="/admin/content/area-guides" className="text-sm text-primary hover:text-primary-mid">
        ← Area Guides
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-black">{society.name}</h1>

      <div className="mt-6">
        <AreaGuideEditor
          societyId={society.id}
          societyName={society.name}
          hasExistingGuide={!!guide}
          initial={{
            overview: guide?.overview ?? "",
            pros: guide?.pros ?? [],
            cons: guide?.cons ?? [],
            review_summary: guide?.review_summary ?? "",
            meta_title: guide?.meta_title ?? "",
            meta_desc: guide?.meta_desc ?? "",
            is_published: guide?.is_published ?? false,
          }}
        />
      </div>
    </div>
  );
}
