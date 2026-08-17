import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { RedirectsManager, type RedirectRow } from "@/components/admin/RedirectsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Redirects | ZProperty Admin" };

export default async function RedirectsPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("redirects")
    .select("id, from_path, to_path, type, is_active, hit_count")
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Redirects</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Manage 301/302 URL redirects stored in the <code>redirects</code> table. Enforced on every public request
        in <code>proxy.ts</code> — a redirect added here takes effect immediately for real visitors.
      </p>

      <RedirectsManager initialRedirects={(data ?? []) as RedirectRow[]} />
    </div>
  );
}
