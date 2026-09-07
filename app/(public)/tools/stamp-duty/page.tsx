import type { Metadata } from "next";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";
import { StampDutyCalculator } from "@/components/portal/tools/StampDutyCalculator";
import { ToolsSidebar } from "@/components/portal/tools/ToolsSidebar";

export const dynamic = "force-static";

export const metadata: Metadata = baseMeta({
  title: "Stamp Duty Calculator Pakistan — Property Transfer Tax",
  description:
    "Calculate stamp duty and transfer taxes for property purchase in Pakistan. Includes CVT and Withholding Tax.",
  alternates: { canonical: `${SITE_URL}/tools/stamp-duty` },
});

const faqs = [
  {
    q: "What is stamp duty on a property purchase in Pakistan?",
    a: "Stamp duty is a provincial tax charged on the property's declared value when a sale deed is registered, payable by the buyer. The exact rate is set by each provincial revenue authority and can change with each year's Finance Act, so always confirm the current rate before a transaction.",
  },
  {
    q: "What is CVT, and how is it different from stamp duty?",
    a: "CVT (Capital Value Tax) is a separate provincial tax on the property's value, charged alongside stamp duty and registration fees -- together these make up most of a buyer's transfer costs.",
  },
  {
    q: "How much is withholding tax under Sections 236K and 236C for FY 2026-27?",
    a: "Following the Finance Act 2026, active tax filers pay 1.25% under Section 236K (buyer) and 2.75% under Section 236C (seller). Non-filers pay substantially more -- 10.5% under 236K and 11.5% under 236C -- and the old 'late filer' middle tier was dropped, so it's now a straight filer-vs-non-filer split.",
  },
  {
    q: "Why does my tax filer status matter?",
    a: "Being an active filer on the FBR Active Taxpayer List cuts your withholding tax substantially on both the buyer's and seller's side of a transaction -- the gap between filer and non-filer rates can run into hundreds of thousands of rupees on a mid-sized property.",
  },
  {
    q: "Where can I check the current, official rates?",
    a: "Tax rates are revised periodically by the federal and provincial governments. Always verify the exact current figures at fbr.gov.pk or with your provincial excise & taxation / revenue authority before relying on any calculator for an actual transaction.",
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

export default function StampDutyCalculatorPage() {
  return (
    <>
      <SchemaScript
        schema={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Tools", href: "/tools" },
          { name: "Stamp Duty Calculator", href: "/tools/stamp-duty" },
        ])}
      />
      <SchemaScript schema={faqSchema} />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="max-w-2xl flex-1">
            <h1 className="text-2xl font-bold text-black">Stamp Duty Calculator</h1>
            <p className="mt-1 text-base text-primary-mid">
              Estimate transfer taxes and fees for your property purchase
            </p>

            <div className="mt-6">
              <StampDutyCalculator />
            </div>

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
          </div>

          <ToolsSidebar activeHref="/tools/stamp-duty" />
        </div>
      </div>
    </>
  );
}
