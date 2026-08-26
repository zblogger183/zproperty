import type { Metadata } from "next";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { AreaConverter } from "@/components/portal/tools/AreaConverter";
import { ToolsSidebar } from "@/components/portal/tools/ToolsSidebar";

export const dynamic = "force-static";

export const metadata: Metadata = baseMeta({
  title: "Property Area Converter Pakistan — Marla, Kanal, Sqft",
  description:
    "Convert between Marla, Kanal, Square Feet, Square Yards, and Square Meters for Pakistani property measurements.",
  alternates: { canonical: `${SITE_URL}/tools/area-converter` },
});

export default function AreaUnitConverterPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="max-w-2xl flex-1">
          <h1 className="text-2xl font-bold text-black">Area Unit Converter</h1>
          <p className="mt-1 text-base text-primary-mid">Convert between marla, kanal, square feet and more</p>

          <div className="mt-6">
            <AreaConverter />
          </div>
        </div>

        <ToolsSidebar activeHref="/tools/area-converter" />
      </div>
    </div>
  );
}
