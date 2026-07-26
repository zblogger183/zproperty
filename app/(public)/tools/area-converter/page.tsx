import type { Metadata } from "next";
import { AreaConverter } from "@/components/portal/tools/AreaConverter";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Property Area Converter Pakistan — Marla, Kanal, Sqft",
  description:
    "Convert between Marla, Kanal, Square Feet, Square Yards, and Square Meters for Pakistani property measurements.",
};

export default function AreaUnitConverterPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Area Unit Converter</h1>
      <p className="mt-1 text-base text-primary-mid">Convert between marla, kanal, square feet and more</p>

      <div className="mt-6">
        <AreaConverter />
      </div>
    </div>
  );
}
