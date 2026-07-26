import type { Metadata } from "next";
import Link from "next/link";
import { EMICalculator } from "@/components/portal/tools/EMICalculator";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "EMI Calculator Pakistan — Mortgage & Home Loan | SarZameenz",
  description:
    "Calculate your monthly home loan installment (EMI) for Pakistan. Enter property price, down payment, interest rate and loan tenure to get instant results.",
};

export default function EMICalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold text-black">Property Loan EMI Calculator</h1>
      <p className="mt-1 text-base text-primary-mid">Calculate your monthly installment for any property</p>

      <div className="mt-6">
        <EMICalculator />
      </div>

      <div className="mt-8">
        <p className="text-lg font-bold text-black">Ready to find a property?</p>
        <Link
          href="/buy/lahore/"
          className="mt-3 inline-block rounded-lg bg-secondary px-6 py-3 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          Browse Properties in Lahore
        </Link>
      </div>
    </div>
  );
}
