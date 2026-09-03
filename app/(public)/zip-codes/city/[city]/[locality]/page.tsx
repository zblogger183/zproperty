import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";

export const revalidate = 86400;

const NEARBY_LIMIT = 6;

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

  // Sibling localities in the same city, for the "nearby zip codes" internal-linking
  // block below -- helps both crawlers and buyers who aren't sure of the exact area
  // name, and gives each locality page enough genuinely different content (not just
  // the same templated paragraph with the area name swapped) to avoid reading as
  // pure boilerplate across hundreds of pages.
  const { data: nearby, error: nearbyError } = await supabase
    .from("postal_codes")
    .select("code, locality_name, area:areas(name, slug)")
    .eq("city_id", city.id)
    .not("area_id", "is", null)
    .neq("area_id", area.id)
    .eq("is_active", true)
    .order("display_order")
    .limit(NEARBY_LIMIT);

  if (nearbyError) {
    console.error("zip-codes nearby query failed", { citySlug, areaSlug, error: nearbyError });
  }

  return { city, area, postalCodes: postalCodes ?? [], nearby: nearby ?? [] };
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

  const { city, area, postalCodes, nearby } = data;
  const primaryCode = postalCodes[0].code;
  const hasMultiple = postalCodes.length > 1;

  const faqs = [
    {
      q: `What is the zip code of ${area.name}, ${city.name}?`,
      a: `The postal (zip) code for ${area.name}, ${city.name}, ${city.province} is ${primaryCode}.`,
    },
    {
      q: "What format do Pakistani postal codes use?",
      a: "Pakistan Post uses 5-digit numeric postal codes. The first two digits generally identify the postal circle or region, and the remaining digits narrow it down to a specific delivery office or locality.",
    },
    {
      q: `Which city and province is ${area.name} in?`,
      a: `${area.name} is located in ${city.name}, ${city.province}, Pakistan.`,
    },
    ...(hasMultiple
      ? [
          {
            q: `Does ${area.name} have more than one postal code?`,
            a: `Yes. ${area.name} is served by ${postalCodes.length} postal codes: ${postalCodes.map((p) => p.code).join(", ")}. Larger areas are sometimes split across more than one delivery office.`,
          },
        ]
      : []),
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <SchemaScript
        schema={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Zip Codes", href: "/zip-codes" },
          { name: city.name, href: `/zip-codes/city/${citySlug}` },
          { name: area.name, href: `/zip-codes/city/${citySlug}/${locality}` },
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
          <p className="mt-3 text-sm leading-relaxed text-black">
            The zip code for {area.name} in {city.name}, {city.province} is <strong>{primaryCode}</strong>. This
            5-digit postal code is assigned by Pakistan Post and is used for mail delivery, online orders, courier
            shipments, and official documents that require a postal or zip code for {area.name}.
            {hasMultiple &&
              ` ${area.name} is served by more than one code depending on the exact delivery office -- see the full list below.`}
          </p>
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

          {hasMultiple && (
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

        <div className="mt-6 rounded-xl border border-primary bg-white p-6">
          <h2 className="text-lg font-bold text-black">Frequently Asked Questions</h2>
          <div className="mt-3 space-y-4">
            {faqs.map((f) => (
              <div key={f.q}>
                <p className="text-sm font-semibold text-black">{f.q}</p>
                <p className="mt-1 text-sm leading-relaxed text-primary-mid">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {nearby.length > 0 && (
          <div className="mt-6 rounded-xl border border-primary bg-white p-6">
            <h2 className="text-lg font-bold text-black">Other Zip Codes in {city.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {nearby.map((row) => {
                const nearbyArea = Array.isArray(row.area) ? row.area[0] : row.area;
                if (!nearbyArea) return null;
                return (
                  <Link
                    key={nearbyArea.slug}
                    href={`/zip-codes/city/${citySlug}/${nearbyArea.slug}`}
                    className="rounded-lg border border-primary px-3 py-1.5 text-sm text-primary hover:bg-primary hover:text-white"
                  >
                    {nearbyArea.name} ({row.code})
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-primary-mid">
          <Link href={`/zip-codes/city/${citySlug}`} className="text-primary hover:underline">
            ← All {city.name} zip codes
          </Link>
        </p>
      </div>
    </>
  );
}
