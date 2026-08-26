import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, HardHat, Receipt, Ruler, Scale, TrendingUp } from "lucide-react";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";

export const metadata: Metadata = baseMeta({
  title: "Free Property Tools — EMI, ROI, Stamp Duty & More | ZProperty.pk",
  description:
    "Free calculators for buying, renting, and building property in Pakistan: EMI, construction cost, area conversion (marla/kanal/sqft), ROI, rent vs buy, and stamp duty.",
  alternates: { canonical: `${SITE_URL}/tools` },
});

const TOOLS = [
  {
    label: "EMI Calculator",
    href: "/tools/emi-calculator",
    Icon: Calculator,
    note: "Estimate your monthly loan installment.",
  },
  {
    label: "Construction Cost",
    href: "/tools/construction-cost",
    Icon: HardHat,
    note: "Estimate construction costs per square foot.",
  },
  {
    label: "Area Converter",
    href: "/tools/area-converter",
    Icon: Ruler,
    note: "Convert between marla, kanal, and square feet.",
  },
  {
    label: "ROI Calculator",
    href: "/tools/roi-calculator",
    Icon: TrendingUp,
    note: "Estimate return on a property investment.",
  },
  {
    label: "Rent vs Buy",
    href: "/tools/rent-vs-buy",
    Icon: Scale,
    note: "Compare renting against buying over time.",
  },
  {
    label: "Stamp Duty",
    href: "/tools/stamp-duty",
    Icon: Receipt,
    note: "Estimate transfer and stamp duty costs.",
  },
];

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-black">Property Tools</h1>
      <p className="mt-2 text-base text-primary-mid">
        Free calculators to help you buy, rent, and build with confidence.
      </p>

      <h2 className="mt-8 text-xl font-bold text-black">All Tools</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ label, href, Icon, note }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-primary p-5 transition hover:border-2 hover:border-secondary"
          >
            <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-black">{label}</p>
            <p className="mt-1 text-xs text-primary-mid">{note}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
