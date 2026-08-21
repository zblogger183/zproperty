import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProjectCreateForm, type DeveloperOption } from "@/components/admin/ProjectCreateForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Add Project | ZProperty Admin" };

export default async function NewProjectPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("users")
    .select("id, name, developer_profiles(company_name)")
    .eq("role", "developer")
    .order("name");

  const developers: DeveloperOption[] = (data ?? []).map((row) => {
    const profile = row.developer_profiles as unknown as { company_name: string | null } | { company_name: string | null }[] | null;
    const companyName = Array.isArray(profile) ? (profile[0]?.company_name ?? null) : (profile?.company_name ?? null);
    return { id: row.id, name: row.name, company_name: companyName };
  });

  return (
    <div className="px-6 py-6">
      <Link href="/admin/projects" className="text-sm text-primary hover:text-primary-mid">
        ← All Projects
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-black">Add Project</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Creates and publishes a project immediately on the developer&apos;s behalf.
      </p>

      <div className="mt-6">
        <ProjectCreateForm developers={developers} />
      </div>
    </div>
  );
}
