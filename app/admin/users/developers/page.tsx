import type { Metadata } from "next";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Developers | SarZameenz Admin" };

interface DeveloperRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  developer_profiles: { company_name: string | null; is_verified: boolean; city: { name: string } | null }[] | null;
}

export default async function DevelopersPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("users")
    .select(
      "id, name, email, phone, is_active, created_at, developer_profiles(company_name, is_verified, city:cities(name))",
    )
    .eq("role", "developer")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as DeveloperRow[];
  const developerIds = rows.map((row) => row.id);

  const { data: projectCounts } =
    developerIds.length > 0
      ? await admin.from("projects").select("developer_id").in("developer_id", developerIds)
      : { data: [] };

  const counts = new Map<string, number>();
  for (const row of projectCounts ?? []) {
    counts.set(row.developer_id, (counts.get(row.developer_id) ?? 0) + 1);
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black">Developers</h1>
        <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
          {rows.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-primary-mid">Registered developers.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Company</th>
              <th className="px-4 py-3 text-left font-semibold">Contact</th>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold">Projects</th>
              <th className="px-4 py-3 text-left font-semibold">Verified</th>
              <th className="px-4 py-3 text-left font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((developer) => {
              const profile = developer.developer_profiles?.[0];
              return (
                <tr key={developer.id} className="border-b border-primary hover:bg-secondary/5">
                  <td className="px-4 py-3 text-sm font-semibold text-black">
                    {profile?.company_name ?? developer.name}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-primary-mid">{developer.email ?? "—"}</p>
                    <p className="text-xs text-primary-mid">{developer.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-primary-mid">{profile?.city?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-black">{counts.get(developer.id) ?? 0}</td>
                  <td className="px-4 py-3">
                    {profile?.is_verified ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="text-xs text-primary-mid">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-primary-mid">
                    {format(new Date(developer.created_at), "MMM d, yyyy")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No developers registered yet.</p>
        )}
      </div>
    </div>
  );
}
