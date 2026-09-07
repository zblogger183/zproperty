import type { Metadata } from "next";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";
import { ConstructionCostCalculator } from "@/components/portal/tools/ConstructionCostCalculator";
import { ToolsSidebar } from "@/components/portal/tools/ToolsSidebar";

export const dynamic = "force-static";

export const metadata: Metadata = baseMeta({
  title: "Construction Cost Calculator Pakistan",
  description:
    "Estimate the cost of building your house in Pakistan. Calculate construction cost per sqft, materials, and labour.",
  alternates: { canonical: `${SITE_URL}/tools/construction-cost` },
});

const faqs = [
  {
    q: "How much does construction cost per sqft in Pakistan?",
    a: "It depends heavily on the quality of construction. As a rough guide: Economy-grade construction runs around PKR 2,500/sqft, Standard-grade around PKR 3,500/sqft, Premium-grade around PKR 5,000/sqft, and Luxury-grade around PKR 8,000/sqft. These are indicative, Lahore-market-based rates -- actual cost varies by city, material choices, and contractor.",
  },
  {
    q: "What does the per-sqft rate include?",
    a: "The calculator splits the estimate into three parts: structure (roughly 60% of the total -- foundation, columns, slabs, and brickwork), finishing (roughly 25% -- flooring, paint, doors, and fittings), and plumbing & electrical work (roughly 15%). Actual proportions vary by design and material grade.",
  },
  {
    q: "Does this include land cost?",
    a: "No. This calculator only estimates the cost of construction on land you already own -- it does not include the price of the plot itself, government fees, or architect/consultancy charges.",
  },
  {
    q: "How accurate is this estimate?",
    a: "Treat it as a starting-point estimate, not a quote. Actual cost can vary by roughly ±20% depending on your city, the contractor you hire, current material prices, and site-specific factors like soil condition and access.",
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

export default function ConstructionCostCalculatorPage() {
  return (
    <>
      <SchemaScript
        schema={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Tools", href: "/tools" },
          { name: "Construction Cost Calculator", href: "/tools/construction-cost" },
        ])}
      />
      <SchemaScript schema={faqSchema} />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="max-w-2xl flex-1">
            <h1 className="text-2xl font-bold text-black">Construction Cost Calculator</h1>
            <p className="mt-1 text-base text-primary-mid">Estimate the cost of building your house in Pakistan</p>

            <div className="mt-6">
              <ConstructionCostCalculator />
            </div>

            <div className="mt-8 rounded-xl border border-primary bg-white p-6">
              <h2 className="text-lg font-bold text-black">How Construction Cost Is Estimated</h2>
              <p className="mt-3 text-sm leading-relaxed text-black">
                Building a house in Pakistan is usually priced per square foot of covered area, at a rate that
                depends on the construction grade you choose. This calculator uses four grade tiers -- Economy,
                Standard, Premium, and Luxury -- each with its own per-sqft rate, then splits the resulting total
                into structure, finishing, and plumbing &amp; electrical costs so you can see roughly where the
                money goes.
              </p>
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
          </div>

          <ToolsSidebar activeHref="/tools/construction-cost" />
        </div>
      </div>
    </>
  );
}
