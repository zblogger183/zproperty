import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";

export const revalidate = 86400;

async function getCity(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, province")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCity(citySlug);
  if (!city) return { title: "City not found | ZProperty.pk" };

  return baseMeta({
    title: `${city.name} Zip Codes — Postal Code List by Area | ZProperty.pk`,
    description: `Complete list of postal (zip) codes for ${city.name}, ${city.province}, organized by neighborhood and area.`,
    alternates: { canonical: `${SITE_URL}/zip-codes/city/${citySlug}` },
  });
}

export default async function ZipCodesCityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const city = await getCity(citySlug);
  if (!city) notFound();

  const supabase = createPublicClient();
  const { data: postalCodes } = await supabase
    .from("postal_codes")
    .select("code, locality_name, area:areas(name, slug)")
    .eq("city_id", city.id)
    .eq("is_active", true)
    .order("display_order");

  const rows = postalCodes ?? [];
  const linkedCount = rows.filter((r) => r.area).length;
  const gpoRow = rows.find((r) => /gpo/i.test(r.locality_name));

  const faqs = [
    {
      q: `How many postal codes does ${city.name} have?`,
      a: `${city.name} has ${rows.length} postal codes on file, covering ${linkedCount} named areas and neighborhoods${
        rows.length > linkedCount ? `, plus ${rows.length - linkedCount} institutional or GPO delivery zones` : ""
      }.`,
    },
    ...(gpoRow
      ? [
          {
            q: `What is ${city.name}'s main GPO postal code?`,
            a: `${city.name}'s General Post Office (GPO) code is ${gpoRow.code}. Individual neighborhoods and sectors within ${city.name} have their own, more specific postal codes -- see the full list below.`,
          },
        ]
      : []),
    {
      q: `Which province is ${city.name} in?`,
      a: `${city.name} is located in ${city.province}, Pakistan.`,
    },
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
        ])}
      />
      <SchemaScript schema={faqSchema} />

      <div className="bg-primary py-10 text-center">
        <h1 className="text-3xl font-bold text-white">{city.name} Zip Codes</h1>
        <p className="mt-2 text-base text-white/70">{city.province}</p>
        <p className="mt-3 text-sm font-bold text-secondary">{rows.length} postal codes</p>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
        {rows.length > 0 && (
          <p className="mb-6 text-sm leading-relaxed text-black">
            Postal (zip) codes for {city.name}, {city.province} are assigned by Pakistan Post and cover every major
            neighborhood, sector, and delivery zone across the city. Use the table below to find the exact zip code
            for a specific area of {city.name} -- click any area name for full details, including nearby codes and
            property listings in that neighborhood.
          </p>
        )}

        <h2 className="sr-only">Postal codes in {city.name}</h2>
        {rows.length === 0 ? (
          <div className="py-16 text-center text-primary-mid">No postal codes listed yet for {city.name}.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-primary">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Area / Locality</th>
                  <th className="px-4 py-3 font-semibold">Zip Code</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const area = Array.isArray(row.area) ? row.area[0] : row.area;
                  const href = area ? `/zip-codes/city/${citySlug}/${area.slug}` : null;
                  return (
                    <tr key={`${row.code}-${row.locality_name}`} className={i % 2 === 0 ? "bg-white" : "bg-primary/5"}>
                      <td className="px-4 py-3 text-black">
                        {href ? (
                          <Link href={href} className="text-primary hover:underline">
                            {row.locality_name}
                          </Link>
                        ) : (
                          row.locality_name
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-black">{row.code}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-8 rounded-xl border border-primary bg-white p-6">
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
        )}
      </div>
    </>
  );
}
