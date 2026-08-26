import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/seo/metadata";
import { SocietyCard } from "@/components/portal/SocietyCard";
import type { SocietyCardData } from "@/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Housing Societies in Pakistan — DHA, Bahria Town & More | ZProperty",
  description:
    "Browse master-planned housing societies across Pakistan — DHA, Bahria Town, and more, with developer details, plot sizes, and payment plans.",
  alternates: { canonical: `${SITE_URL}/societies` },
};

const SOCIETY_COLUMNS = "id, slug, name, developer_name, avg_price_marla, cover_image_url, city:cities(name, slug)";

export default async function SocietiesPage() {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("societies")
    .select(SOCIETY_COLUMNS)
    .eq("is_active", true)
    .order("name");

  const societies = (data ?? []) as unknown as SocietyCardData[];

  return (
    <>
      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">Societies</h1>
        <p className="mt-2 text-base text-white/70">Master-planned housing societies across Pakistan</p>
        <p className="mt-3 text-sm font-bold text-secondary">{societies.length} societies</p>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        {societies.length === 0 ? (
          <div className="py-20 text-center text-primary-mid">No societies listed yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {societies.map((society) => (
              <SocietyCard key={society.id} society={society} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
