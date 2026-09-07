import type { Metadata } from "next";
import Link from "next/link";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";
import { EMICalculator } from "@/components/portal/tools/EMICalculator";
import { ToolsSidebar } from "@/components/portal/tools/ToolsSidebar";

export const dynamic = "force-static";

export const metadata: Metadata = baseMeta({
  title: "EMI Calculator Pakistan — Mortgage & Home Loan | ZProperty",
  description:
    "Calculate your monthly home loan installment (EMI) for Pakistan. Enter property price, down payment, interest rate and loan tenure to get instant results.",
  alternates: { canonical: `${SITE_URL}/tools/emi-calculator` },
});

const faqs = [
  {
    q: "How is EMI calculated?",
    a: "EMI (Equal Monthly Installment) is calculated from your loan amount (property price minus down payment), the annual interest rate, and the loan tenure, using the standard reducing-balance amortization formula banks use. Each installment is the same amount, but the split between interest and principal changes over the loan term.",
  },
  {
    q: "What down payment and interest rate should I use?",
    a: "Pakistani banks typically require a minimum down payment of around 10-20% of the property price, and home loan interest rates commonly run in the 17-22% range depending on the bank, loan type, and prevailing State Bank policy rate at the time -- use your bank's current quoted rate for an accurate estimate rather than a generic figure.",
  },
  {
    q: "Is this EMI figure exact?",
    a: "This is an estimate based on the inputs you provide. Actual bank EMI may differ slightly due to processing fees, insurance add-ons, or a different amortization method -- confirm the exact figure with your bank before committing.",
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

export default function EMICalculatorPage() {
  return (
    <>
      <SchemaScript
        schema={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Tools", href: "/tools" },
          { name: "EMI Calculator", href: "/tools/emi-calculator" },
        ])}
      />
      <SchemaScript schema={faqSchema} />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="max-w-2xl flex-1">
            <h1 className="text-2xl font-bold text-black">Property Loan EMI Calculator</h1>
            <p className="mt-1 text-base text-primary-mid">Calculate your monthly installment for any property</p>

            <div className="mt-6">
              <EMICalculator />
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

            <div className="mt-8">
              <p className="text-lg font-bold text-black">Ready to find a property?</p>
              <Link
                href="/buy/lahore/"
                className="mt-3 inline-block rounded-lg bg-secondary px-6 py-3 text-sm font-bold text-primary hover:bg-secondary-dark"
              >
                Browse Properties in Lahore
              </Link>
            </div>
          </div>

          <ToolsSidebar activeHref="/tools/emi-calculator" />
        </div>
      </div>
    </>
  );
}
