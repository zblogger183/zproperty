import type { Metadata } from "next";
import { StampDutyCalculator } from "@/components/portal/tools/StampDutyCalculator";
import { ToolsSidebar } from "@/components/portal/tools/ToolsSidebar";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Stamp Duty Calculator Pakistan — Property Transfer Tax",
  description:
    "Calculate stamp duty and transfer taxes for property purchase in Pakistan. Includes CVT and Withholding Tax.",
};

export default function StampDutyCalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="max-w-2xl flex-1">
          <h1 className="text-2xl font-bold text-black">Stamp Duty Calculator</h1>
          <p className="mt-1 text-base text-primary-mid">Estimate transfer taxes and fees for your property purchase</p>

          <div className="mt-6">
            <StampDutyCalculator />
          </div>
        </div>

        <ToolsSidebar activeHref="/tools/stamp-duty" />
      </div>
    </div>
  );
}
