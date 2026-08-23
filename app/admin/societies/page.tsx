import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "All Societies | ZProperty Admin" };

interface AdminSocietyRow {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  developer_name: string | null;
  listing_count: number;
  is_active: boolean;
  city: { name: string; slug: string } | null;
}

export default async function AllSocietiesPage() {
  const admin = createAdminClient();

  const { data, count } = await admin
    .from("societies")
    .select("id, name, slug, cover_image_url, developer_name, listing_count, is_active, city:cities(name, slug)", {
      count: "exact",
    })
    .order("name");

  const societies = (data ?? []) as unknown as AdminSocietyRow[];

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">All Societies</h1>
        <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
          {count ?? 0} total
        </span>
        <Link
          href="/admin/societies/new"
          className="ml-auto rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          + Add Society
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Image</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Master Developer</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold">Listings</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {societies.map((society) => (
              <tr key={society.id} className="border-b border-primary hover:bg-secondary/5">
                <td className="px-4 py-3">
                  {society.cover_image_url ? (
                    <div className="relative h-9 w-12 overflow-hidden rounded border border-primary">
                      <Image src={society.cover_image_url} alt="" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-9 w-12 rounded bg-primary-mid" />
                  )}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-black">{society.name}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">{society.developer_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">{society.city?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-primary-mid">{society.listing_count}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      society.is_active ? "bg-secondary text-primary" : "border border-primary bg-white text-black"
                    }`}
                  >
                    {society.is_active ? "active" : "inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {society.city && (
                    <Link
                      href={`/area-guide/${society.city.slug}/${society.slug}`}
                      target="_blank"
                      className="text-xs text-primary underline"
                    >
                      View
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {societies.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No societies yet.</p>
        )}
      </div>
    </div>
  );
}
