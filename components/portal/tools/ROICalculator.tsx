"use client";

import { useState } from "react";

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-PK");
}

type Tab = "rental" | "capital";

export function ROICalculator() {
  const [tab, setTab] = useState<Tab>("rental");

  // Rental yield inputs
  const [priceInput, setPriceInput] = useState("10,000,000");
  const [rentInput, setRentInput] = useState("40,000");
  const [expensesInput, setExpensesInput] = useState("0");

  // Capital gains inputs
  const [purchaseInput, setPurchaseInput] = useState("10,000,000");
  const [currentValueInput, setCurrentValueInput] = useState("14,000,000");
  const [yearsHeld, setYearsHeld] = useState(5);

  const price = Number(priceInput.replace(/,/g, "")) || 0;
  const monthlyRent = Number(rentInput.replace(/,/g, "")) || 0;
  const annualExpenses = Number(expensesInput.replace(/,/g, "")) || 0;
  const annualRent = monthlyRent * 12;

  const grossYield = price > 0 ? (annualRent / price) * 100 : 0;
  const netAnnualIncome = annualRent - annualExpenses;
  const netYield = price > 0 ? (netAnnualIncome / price) * 100 : 0;
  const monthlyIncomeAfterExpenses = netAnnualIncome / 12;
  const paybackYears = netAnnualIncome > 0 ? price / netAnnualIncome : 0;

  const purchasePrice = Number(purchaseInput.replace(/,/g, "")) || 0;
  const currentValue = Number(currentValueInput.replace(/,/g, "")) || 0;
  const totalGain = currentValue - purchasePrice;
  const gainPct = purchasePrice > 0 ? (totalGain / purchasePrice) * 100 : 0;
  const cagr =
    purchasePrice > 0 && yearsHeld > 0 ? (Math.pow(currentValue / purchasePrice, 1 / yearsHeld) - 1) * 100 : 0;
  const afterCgt = totalGain * 0.9;

  return (
    <div>
      <div className="flex rounded-lg border border-primary p-1">
        <button
          type="button"
          onClick={() => setTab("rental")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            tab === "rental" ? "bg-primary text-white" : "text-primary"
          }`}
        >
          Rental Yield
        </button>
        <button
          type="button"
          onClick={() => setTab("capital")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            tab === "capital" ? "bg-primary text-white" : "text-primary"
          }`}
        >
          Capital Gains
        </button>
      </div>

      {tab === "rental" ? (
        <div className="mt-5">
          <div>
            <label className="block text-sm font-semibold text-black" htmlFor="roi-price">
              Property Price (PKR)
            </label>
            <input
              id="roi-price"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              onBlur={() => {
                const numeric = Number(priceInput.replace(/,/g, "")) || 0;
                setPriceInput(numeric ? formatNumber(numeric) : "");
              }}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-black" htmlFor="roi-rent">
              Monthly Rent (PKR)
            </label>
            <input
              id="roi-rent"
              value={rentInput}
              onChange={(event) => setRentInput(event.target.value)}
              onBlur={() => {
                const numeric = Number(rentInput.replace(/,/g, "")) || 0;
                setRentInput(numeric ? formatNumber(numeric) : "");
              }}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-black" htmlFor="roi-expenses">
              Annual Expenses (PKR)
            </label>
            <input
              id="roi-expenses"
              value={expensesInput}
              onChange={(event) => setExpensesInput(event.target.value)}
              onBlur={() => {
                const numeric = Number(expensesInput.replace(/,/g, "")) || 0;
                setExpensesInput(numeric ? formatNumber(numeric) : "0");
              }}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
            />
            <p className="mt-1 text-xs text-primary-mid">Maintenance, taxes, etc. (optional)</p>
          </div>

          <div className="mt-6 rounded-xl bg-primary p-6">
            <p className="text-sm text-white/70">Net Rental Yield</p>
            <p className="text-4xl font-bold text-secondary">{netYield.toFixed(2)}%</p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-white/70">Gross Yield</span>
                <span className="text-sm font-semibold text-white">{grossYield.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/70">Monthly Income After Expenses</span>
                <span className="text-sm font-semibold text-white">PKR {formatNumber(monthlyIncomeAfterExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/70">Payback Period</span>
                <span className="text-sm font-semibold text-white">
                  {paybackYears > 0 ? `${paybackYears.toFixed(1)} years` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <div>
            <label className="block text-sm font-semibold text-black" htmlFor="roi-purchase">
              Purchase Price (PKR)
            </label>
            <input
              id="roi-purchase"
              value={purchaseInput}
              onChange={(event) => setPurchaseInput(event.target.value)}
              onBlur={() => {
                const numeric = Number(purchaseInput.replace(/,/g, "")) || 0;
                setPurchaseInput(numeric ? formatNumber(numeric) : "");
              }}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-black" htmlFor="roi-current">
              Current / Expected Value (PKR)
            </label>
            <input
              id="roi-current"
              value={currentValueInput}
              onChange={(event) => setCurrentValueInput(event.target.value)}
              onBlur={() => {
                const numeric = Number(currentValueInput.replace(/,/g, "")) || 0;
                setCurrentValueInput(numeric ? formatNumber(numeric) : "");
              }}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-black" htmlFor="roi-years">
              Years Held ({yearsHeld})
            </label>
            <input
              id="roi-years"
              type="range"
              min={1}
              max={30}
              value={yearsHeld}
              onChange={(event) => setYearsHeld(Number(event.target.value))}
              className="mt-2 w-full accent-secondary"
            />
          </div>

          <div className="mt-6 rounded-xl bg-primary p-6">
            <p className="text-sm text-white/70">Total Gain</p>
            <p className="text-4xl font-bold text-secondary">PKR {formatNumber(totalGain)}</p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-white/70">Gain Percentage</span>
                <span className="text-sm font-semibold text-white">{gainPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/70">Annual Return (CAGR)</span>
                <span className="text-sm font-semibold text-white">{cagr.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/70">After CGT (est. 10%)</span>
                <span className="text-sm font-semibold text-white">PKR {formatNumber(afterCgt)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-white">* Capital Gains Tax rate varies — verify with FBR</p>
          </div>
        </div>
      )}
    </div>
  );
}
