import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProjectForm } from "@/components/dashboard/ProjectForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Add Project | ZProperty" };

export default async function NewDeveloperProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "developer") redirect("/dashboard");

  return (
    <div className="px-6 py-6">
      <Link href="/dashboard/projects" className="text-sm text-primary hover:text-primary-mid">
        ← My Projects
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-black">Add Project</h1>
      <p className="mt-1 text-sm text-primary-mid">Submit a new project for review — it goes live once approved.</p>

      <div className="mt-6">
        <ProjectForm />
      </div>
    </div>
  );
}
