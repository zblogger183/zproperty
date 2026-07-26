import type { Metadata } from "next";
import { StampDutyCalculator } from "@/components/portal/tools/StampDutyCalculator";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Stamp Duty Calculator Pakistan — Property Transfer Tax",
  description:
    "Calculate stamp duty and transfer taxes for property purchase in Pakistan. Includes CVT and Withholding Tax.",
};

export default function StampDutyCalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Stamp Duty Calculator</h1>
      <p className="mt-1 text-base text-primary-mid">Estimate transfer taxes and fees for your property purchase</p>

      <div className="mt-6">
        <StampDutyCalculator />
      </div>
    </div>
  );
}
