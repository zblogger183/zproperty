"use client";

import { useState } from "react";

const TENURE_OPTIONS = [5, 10, 15, 20, 25, 30];

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-PK");
}

export function EMICalculator() {
  const [priceInput, setPriceInput] = useState("10,000,000");
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(18);
  const [tenureYears, setTenureYears] = useState(20);

  const price = Number(priceInput.replace(/,/g, "")) || 0;
  const downPaymentAmount = Math.round((price * downPaymentPct) / 100);
  const principal = Math.max(0, price - downPaymentAmount);
  const monthlyRate = interestRate / 12 / 100;
  const months = tenureYears * 12;

  let emi = 0;
  if (principal > 0 && months > 0) {
    if (monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, months);
      emi = (principal * monthlyRate * factor) / (factor - 1);
    } else {
      emi = principal / months;
    }
  }
  emi = Math.round(emi);

  const totalPayment = emi * months;
  const totalInterest = Math.max(0, totalPayment - principal);

  return (
    <div>
      <div>
        <label className="block text-sm font-semibold text-black" htmlFor="emi-price">
          Property Price (PKR)
        </label>
        <input
          id="emi-price"
          value={priceInput}
          onChange={(event) => setPriceInput(event.target.value)}
          onBlur={() => {
            const numeric = Number(priceInput.replace(/,/g, "")) || 0;
            setPriceInput(numeric ? formatNumber(numeric) : "");
          }}
          placeholder="e.g. 10,000,000"
          inputMode="numeric"
          className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
        />
      </div>

      <div className="mt-5">
        <label className="block text-sm font-semibold text-black" htmlFor="emi-down-payment">
          Down Payment ({downPaymentPct}%)
        </label>
        <input
          id="emi-down-payment"
          type="range"
          min={10}
          max={50}
          step={5}
          value={downPaymentPct}
          onChange={(event) => setDownPaymentPct(Number(event.target.value))}
          className="mt-2 w-full accent-secondary"
        />
        <p className="mt-1 text-xs text-primary-mid">PKR {formatNumber(downPaymentAmount)}</p>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-semibold text-black" htmlFor="emi-interest-rate">
          Interest Rate ({interestRate}% per year)
        </label>
        <input
          id="emi-interest-rate"
          type="range"
          min={5}
          max={30}
          step={0.5}
          value={interestRate}
          onChange={(event) => setInterestRate(Number(event.target.value))}
          className="mt-2 w-full accent-secondary"
        />
        <p className="mt-1 text-xs text-primary-mid">Current bank rates: 17-22%</p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-black">Loan Tenure (years)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TENURE_OPTIONS.map((years) => (
            <button
              key={years}
              type="button"
              onClick={() => setTenureYears(years)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                tenureYears === years ? "bg-primary text-white" : "border border-primary bg-white text-black"
              }`}
            >
              {years}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-primary p-6">
        <p className="text-sm text-white/70">Monthly EMI</p>
        <p className="text-4xl font-bold text-secondary">PKR {formatNumber(emi)}</p>

        <div className="mt-4 flex flex-wrap gap-8 text-sm text-white">
          <span>Loan Amount: PKR {formatNumber(principal)}</span>
          <span>Total Interest: PKR {formatNumber(totalInterest)}</span>
          <span>Total Payment: PKR {formatNumber(totalPayment)}</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-primary-mid">* This is an estimate. Contact a bank for exact figures.</p>
    </div>
  );
}
