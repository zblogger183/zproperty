import type { Metadata } from "next";
import { ConstructionCostCalculator } from "@/components/portal/tools/ConstructionCostCalculator";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Construction Cost Calculator Pakistan",
  description:
    "Estimate the cost of building your house in Pakistan. Calculate construction cost per sqft, materials, and labour.",
};

export default function ConstructionCostCalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Construction Cost Calculator</h1>
      <p className="mt-1 text-base text-primary-mid">Estimate the cost of building your house in Pakistan</p>

      <div className="mt-6">
        <ConstructionCostCalculator />
      </div>
    </div>
  );
}
