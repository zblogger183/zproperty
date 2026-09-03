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
        schema={breadcrumbSchema([{ name: "Home", href: "/" }, { name: "Zip Codes", href: "/zip-codes" }])}
      />

      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">Pakistan Zip Codes</h1>
        <p className="mt-2 text-base text-white/70">Postal codes by province, city, and area</p>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <p className="mb-8 text-sm leading-relaxed text-black">
          A postal (zip) code is a 5-digit number assigned by Pakistan Post to identify a specific delivery area --
          a neighborhood, sector, or institution -- within a city. Postal codes are used for mail delivery, courier
          and e-commerce shipments, and on official forms that ask for a zip or postal code. Select a province below
          to browse its cities, then a city to find the exact zip code for any area or neighborhood.
        </p>

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

        <div className="mt-10 rounded-xl border border-primary bg-white p-6">
          <h2 className="text-lg font-bold text-black">Frequently Asked Questions</h2>
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-sm font-semibold text-black">How many digits are in a Pakistani postal code?</p>
              <p className="mt-1 text-sm leading-relaxed text-primary-mid">
                Pakistani postal codes are 5 digits long. The first two digits generally identify the postal circle
                or region, and the remaining digits narrow it down to a specific city, sector, or delivery office.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-black">Who assigns postal codes in Pakistan?</p>
              <p className="mt-1 text-sm leading-relaxed text-primary-mid">
                Postal codes in Pakistan are assigned and maintained by Pakistan Post, the country&apos;s national
                postal service.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-black">Can one area have more than one zip code?</p>
              <p className="mt-1 text-sm leading-relaxed text-primary-mid">
                Yes. Larger neighborhoods or sectors are sometimes served by more than one postal code, usually
                split by the delivery office responsible for that part of the area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
