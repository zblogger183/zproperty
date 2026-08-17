import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Area Guides | ZProperty Admin" };

interface SocietyRow {
  id: string;
  name: string;
  area: { name: string; city: { name: string } | null } | null;
  area_guides: { is_published: boolean; updated_at: string | null }[] | null;
}

export default async function AreaGuidesPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("societies")
    .select("id, name, area:areas(name, city:cities(name)), area_guides(is_published, updated_at)")
    .eq("is_active", true)
    .order("name");

  const societies = (data ?? []) as unknown as SocietyRow[];

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Area Guides</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Manage neighborhood guides, one per society. A guide only appears publicly once published.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Society</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-left font-semibold">Guide Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {societies.map((society) => {
              const guide = society.area_guides?.[0] ?? null;
              return (
                <tr key={society.id} className="border-b border-primary hover:bg-secondary/5">
                  <td className="px-4 py-3 text-sm font-semibold text-black">{society.name}</td>
                  <td className="px-4 py-3 text-xs text-primary-mid">
                    {[society.area?.name, society.area?.city?.name].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {guide ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          guide.is_published ? "bg-secondary text-primary" : "border border-primary bg-white text-primary"
                        }`}
                      >
                        {guide.is_published ? "Published" : "Draft"}
                      </span>
                    ) : (
                      <span className="text-xs text-primary-mid">No guide yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/content/area-guides/${society.id}`}
                      className="text-xs font-semibold text-primary underline"
                    >
                      {guide ? "Edit" : "Create"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {societies.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-primary-mid">
              No societies exist yet. Area guides are written per society, so add societies (via the
              <code> societies</code> table) before creating guides here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
