import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";

export const revalidate = 86400;

export const metadata: Metadata = baseMeta({
  title: "Pakistan Zip Codes — Postal Codes by Province & City | ZProperty.pk",
  description:
    "Find postal (zip) codes for every province and city across Pakistan, organized by area and neighborhood.",
  alternates: { canonical: `${SITE_URL}/zip-codes` },
});

export default async function ZipCodesIndexPage() {
  const supabase = createPublicClient();

  const { data: cities } = await supabase
    .from("cities")
    .select("name, slug, province")
    .eq("is_active", true)
    .order("province")
    .order("display_order");

  const byProvince = new Map<string, { name: string; slug: string }[]>();
  for (const city of cities ?? []) {
    const list = byProvince.get(city.province) ?? [];
    list.push({ name: city.name, slug: city.slug });
    byProvince.set(city.province, list);
  }

  return (
    <>
      <SchemaScript
        schema={breadcrumbSchema([{ name: "Home", href: "/" }, { name: "Zip Codes" }])}
      />

      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">Pakistan Zip Codes</h1>
        <p className="mt-2 text-base text-white/70">Postal codes by province, city, and area</p>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <h2 className="sr-only">Provinces</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[...byProvince.entries()].map(([province, cityList]) => (
            <div key={province} className="rounded-xl border border-primary bg-white p-5">
              <h3 className="text-lg font-bold text-black">{province}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {cityList.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/zip-codes/city/${city.slug}`}
                    className="rounded-lg border border-primary px-3 py-1.5 text-sm text-primary hover:bg-primary hover:text-white"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
