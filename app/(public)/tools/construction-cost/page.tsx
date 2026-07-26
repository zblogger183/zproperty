import type { Metadata } from "next";
import { ConstructionCostCalculator } from "@/components/portal/tools/ConstructionCostCalculator";
import { ToolsSidebar } from "@/components/portal/tools/ToolsSidebar";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Construction Cost Calculator Pakistan",
  description:
    "Estimate the cost of building your house in Pakistan. Calculate construction cost per sqft, materials, and labour.",
};

export default function ConstructionCostCalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="max-w-2xl flex-1">
          <h1 className="text-2xl font-bold text-black">Construction Cost Calculator</h1>
          <p className="mt-1 text-base text-primary-mid">Estimate the cost of building your house in Pakistan</p>

          <div className="mt-6">
            <ConstructionCostCalculator />
          </div>
        </div>

        <ToolsSidebar activeHref="/tools/construction-cost" />
      </div>
    </div>
  );
}
