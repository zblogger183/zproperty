import Link from "next/link";
import { Calculator, HardHat, Receipt, Ruler, Scale, TrendingUp } from "lucide-react";

const TOOLS = [
  { label: "EMI Calculator", href: "/tools/emi-calculator", Icon: Calculator },
  { label: "Construction Cost", href: "/tools/construction-cost", Icon: HardHat },
  { label: "Area Converter", href: "/tools/area-converter", Icon: Ruler },
  { label: "ROI Calculator", href: "/tools/roi-calculator", Icon: TrendingUp },
  { label: "Rent vs Buy", href: "/tools/rent-vs-buy", Icon: Scale },
  { label: "Stamp Duty", href: "/tools/stamp-duty", Icon: Receipt },
];

export function ToolsBar() {
  return (
    <section className="bg-primary px-4 py-10">
      <h2 className="text-center text-2xl font-bold text-white">Property Tools</h2>

      <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-3">
        {TOOLS.map(({ label, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border-2 border-secondary bg-white p-5 text-center transition hover:bg-secondary"
          >
            <Icon className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-black">{label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
