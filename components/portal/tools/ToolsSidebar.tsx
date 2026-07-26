import Link from "next/link";

const TOOLS = [
  { label: "EMI Calculator", href: "/tools/emi-calculator" },
  { label: "Construction Cost", href: "/tools/construction-cost" },
  { label: "Area Converter", href: "/tools/area-converter" },
  { label: "ROI Calculator", href: "/tools/roi-calculator" },
  { label: "Rent vs Buy", href: "/tools/rent-vs-buy" },
  { label: "Stamp Duty", href: "/tools/stamp-duty" },
];

export function ToolsSidebar({ activeHref }: { activeHref: string }) {
  return (
    <div className="w-full shrink-0 lg:w-64">
      <div className="rounded-xl border border-primary bg-white p-4">
        <p className="mb-3 text-sm font-bold text-black">Other Tools</p>
        <div className="flex flex-col gap-1">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={
                tool.href === activeHref
                  ? "rounded-lg bg-primary px-3 py-2 text-sm text-white"
                  : "rounded-lg px-3 py-2 text-sm text-primary hover:text-primary-mid"
              }
            >
              {tool.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-primary p-4">
        <p className="text-sm font-bold text-white">Ready to buy a property?</p>
        <p className="mt-1 text-xs text-white">Browse verified listings in Lahore</p>
        <Link
          href="/buy/lahore"
          className="mt-3 block w-full rounded-lg bg-secondary py-2.5 text-center text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          Browse Now
        </Link>
      </div>

      <div className="mt-4 rounded-xl border border-primary bg-white p-4">
        <p className="text-sm font-bold text-black">Need expert advice?</p>
        <p className="mt-1 text-xs text-primary-mid">Connect with a CNIC-verified agent</p>
        <Link
          href="/agents"
          className="mt-3 block w-full rounded-lg bg-primary py-2 text-center text-sm text-white hover:bg-primary-mid"
        >
          Find Agents
        </Link>
      </div>
    </div>
  );
}
