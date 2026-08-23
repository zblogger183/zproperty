import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { SocietyCreateForm, type CityOption } from "@/components/admin/SocietyCreateForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Add Society | ZProperty Admin" };

export default async function NewSocietyPage() {
  const admin = createAdminClient();

  const { data } = await admin.from("cities").select("id, name").eq("is_active", true).order("name");

  const cities: CityOption[] = (data ?? []) as CityOption[];

  return (
    <div className="px-6 py-6">
      <Link href="/admin/societies" className="text-sm text-primary hover:text-primary-mid">
        ← All Societies
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-black">Add Society</h1>
      <p className="mt-1 text-sm text-primary-mid">
        Creates a housing society/scheme profile — powers its /area-guide page and lets projects link to it.
      </p>

      <div className="mt-6">
        <SocietyCreateForm cities={cities} />
      </div>
    </div>
  );
}
