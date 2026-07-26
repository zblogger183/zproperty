import type { Metadata } from "next";
import { RentVsBuyCalculator } from "@/components/portal/tools/RentVsBuyCalculator";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Rent vs Buy Calculator Pakistan — Should I Rent or Buy?",
  description: "Compare renting vs buying a home in Pakistan. Calculate which option saves more money over time.",
};

export default function RentVsBuyCalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Rent vs Buy Calculator</h1>
      <p className="mt-1 text-base text-primary-mid">Compare the long-term cost of renting versus buying</p>

      <div className="mt-6">
        <RentVsBuyCalculator />
      </div>
    </div>
  );
}
