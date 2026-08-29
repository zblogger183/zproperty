import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";

export const revalidate = 86400;

async function getData(citySlug: string, areaSlug: string) {
  const supabase = createPublicClient();
  const { data: city } = await supabase
    .from("cities")
    .select("id, name, slug, province")
    .eq("slug", citySlug)
    .maybeSingle();
  if (!city) return null;

  const { data: area } = await supabase
    .from("areas")
    .select("id, name, slug")
    .eq("city_id", city.id)
    .eq("slug", areaSlug)
    .maybeSingle();
  if (!area) return null;

  const { data: postalCodes } = await supabase
    .from("postal_codes")
    .select("code, locality_name")
    .eq("city_id", city.id)
    .eq("area_id", area.id)
    .eq("is_active", true)
    .order("display_order");

  return { city, area, postalCodes: postalCodes ?? [] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; locality: string }>;
}): Promise<Metadata> {
  const { city: citySlug, locality } = await params;
  const data = await getData(citySlug, locality);
  if (!data || data.postalCodes.length === 0) return { title: "Zip code not found | ZProperty.pk" };

  const code = data.postalCodes[0].code;
  return baseMeta({
    title: `${data.area.name}, ${data.city.name} Zip Code — ${code} | ZProperty.pk`,
    description: `The postal (zip) code for ${data.area.name}, ${data.city.name}, ${data.city.province} is ${code}. Browse properties for sale and rent in ${data.area.name}.`,
    alternates: { canonical: `${SITE_URL}/zip-codes/city/${citySlug}/${locality}` },
  });
}

export default async function ZipCodeLocalityPage({
  params,
}: {
  params: Promise<{ city: string; locality: string }>;
}) {
  const { city: citySlug, locality } = await params;
  const data = await getData(citySlug, locality);
  if (!data || data.postalCodes.length === 0) notFound();

  const { city, area, postalCodes } = data;
  const primaryCode = postalCodes[0].code;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the zip code of ${area.name}, ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The postal (zip) code for ${area.name}, ${city.name}, ${city.province} is ${primaryCode}.`,
        },
      },
    ],
  };

  return (
    <>
      <SchemaScript
        schema={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Zip Codes", href: "/zip-codes" },
          { name: city.name, href: `/zip-codes/city/${citySlug}` },
          { name: area.name },
        ])}
      />
      <SchemaScript schema={faqSchema} />

      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">
          {area.name}, {city.name} Zip Code
        </h1>
        <p className="mt-3 text-4xl font-bold text-secondary">{primaryCode}</p>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
        <div className="rounded-xl border border-primary bg-white p-6">
          <h2 className="text-lg font-bold text-black">Postal Code Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-primary/20 pb-2">
              <dt className="text-primary-mid">Area</dt>
              <dd className="font-semibold text-black">{area.name}</dd>
            </div>
            <div className="flex justify-between border-b border-primary/20 pb-2">
              <dt className="text-primary-mid">City</dt>
              <dd className="font-semibold text-black">{city.name}</dd>
            </div>
            <div className="flex justify-between border-b border-primary/20 pb-2">
              <dt className="text-primary-mid">Province</dt>
              <dd className="font-semibold text-black">{city.province}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-primary-mid">Zip / Postal Code</dt>
              <dd className="font-mono font-bold text-black">{primaryCode}</dd>
            </div>
          </dl>

          {postalCodes.length > 1 && (
            <p className="mt-4 text-xs text-primary-mid">
              This area is also served by: {postalCodes.slice(1).map((p) => p.code).join(", ")}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-secondary bg-white p-6 text-center">
          <p className="text-base font-semibold text-black">Looking for property in {area.name}?</p>
          <Link
            href={`/buy/${citySlug}/${area.slug}`}
            className="mt-3 inline-block rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary-dark"
          >
            Browse Listings in {area.name} →
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-primary-mid">
          <Link href={`/zip-codes/city/${citySlug}`} className="text-primary hover:underline">
            ← All {city.name} zip codes
          </Link>
        </p>
      </div>
    </>
  );
}
