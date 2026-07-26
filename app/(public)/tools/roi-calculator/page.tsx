import type { Metadata } from "next";
import { ROICalculator } from "@/components/portal/tools/ROICalculator";
import { ToolsSidebar } from "@/components/portal/tools/ToolsSidebar";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Property ROI Calculator Pakistan — Rental Yield Calculator",
  description: "Calculate your property investment returns in Pakistan. Rental yield, capital gains, and total ROI calculator.",
};

export default function ROICalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="max-w-2xl flex-1">
          <h1 className="text-2xl font-bold text-black">Property ROI Calculator</h1>
          <p className="mt-1 text-base text-primary-mid">Estimate rental yield and capital gains on your investment</p>

          <div className="mt-6">
            <ROICalculator />
          </div>
        </div>

        <ToolsSidebar activeHref="/tools/roi-calculator" />
      </div>
    </div>
  );
}
