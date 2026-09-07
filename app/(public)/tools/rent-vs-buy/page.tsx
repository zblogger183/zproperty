import type { Metadata } from "next";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { SchemaScript, breadcrumbSchema } from "@/lib/seo/schemas";
import { RentVsBuyCalculator } from "@/components/portal/tools/RentVsBuyCalculator";
import { ToolsSidebar } from "@/components/portal/tools/ToolsSidebar";

export const dynamic = "force-static";

export const metadata: Metadata = baseMeta({
  title: "Rent vs Buy Calculator Pakistan — Should I Rent or Buy?",
  description: "Compare renting vs buying a home in Pakistan. Calculate which option saves more money over time.",
  alternates: { canonical: `${SITE_URL}/tools/rent-vs-buy` },
});

const faqs = [
  {
    q: "How does this calculator decide whether renting or buying wins?",
    a: "It projects both paths forward over the number of years you choose. For buying, it adds up your down payment, EMI payments, and remaining loan balance against the property's projected value at the end. For renting, it adds up total rent paid (with your chosen annual increase) against what your down payment would be worth if invested elsewhere instead. Whichever path leaves you with a higher net position wins.",
  },
  {
    q: "What assumptions does it make?",
    a: "You control the home price, down payment, mortgage rate, loan tenure, monthly rent, annual rent increase, and expected property appreciation. The one fixed assumption is an 8% annual return on the down payment if invested instead of used to buy -- a simplified opportunity-cost benchmark, not a specific investment recommendation.",
  },
  {
    q: "What isn't included in this comparison?",
    a: "This is a simplified model. It excludes property taxes, maintenance costs, society/DHA maintenance charges, insurance, and transaction costs like stamp duty on the buy side, and excludes any deposit or agent commission on the rent side. Use it to compare the broad shape of the two paths, not as a precise financial plan.",
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

export default function RentVsBuyCalculatorPage() {
  return (
    <>
      <SchemaScript
        schema={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Tools", href: "/tools" },
          { name: "Rent vs Buy Calculator", href: "/tools/rent-vs-buy" },
        ])}
      />
      <SchemaScript schema={faqSchema} />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="max-w-2xl flex-1">
            <h1 className="text-2xl font-bold text-black">Rent vs Buy Calculator</h1>
            <p className="mt-1 text-base text-primary-mid">Compare the long-term cost of renting versus buying</p>

            <div className="mt-6">
              <RentVsBuyCalculator />
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

          <ToolsSidebar activeHref="/tools/rent-vs-buy" />
        </div>
      </div>
    </>
  );
}
