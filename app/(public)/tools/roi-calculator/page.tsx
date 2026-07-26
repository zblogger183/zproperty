import type { Metadata } from "next";
import { ROICalculator } from "@/components/portal/tools/ROICalculator";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Property ROI Calculator Pakistan — Rental Yield Calculator",
  description: "Calculate your property investment returns in Pakistan. Rental yield, capital gains, and total ROI calculator.",
};

export default function ROICalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Property ROI Calculator</h1>
      <p className="mt-1 text-base text-primary-mid">Estimate rental yield and capital gains on your investment</p>

      <div className="mt-6">
        <ROICalculator />
      </div>
    </div>
  );
}
