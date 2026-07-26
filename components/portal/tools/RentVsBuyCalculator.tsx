"use client";

import { useState } from "react";

const TENURE_OPTIONS = [5, 10, 15, 20];
const YEARS_OPTIONS = [5, 10, 15, 20];
const INVESTMENT_RETURN_RATE = 8; // opportunity cost of down payment if invested instead

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-PK");
}

function calculateEmi(principal: number, annualRatePct: number, years: number): number {
  const monthlyRate = annualRatePct / 12 / 100;
  const months = years * 12;
  if (principal <= 0 || months <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function RentVsBuyCalculator() {
  const [priceInput, setPriceInput] = useState("10,000,000");
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(20);
  const [tenureYears, setTenureYears] = useState(20);
  const [rentInput, setRentInput] = useState("40,000");
  const [rentIncreasePct, setRentIncreasePct] = useState(5);
  const [yearsToCompare, setYearsToCompare] = useState(10);
  const [appreciationPct, setAppreciationPct] = useState(8);

  const homePrice = Number(priceInput.replace(/,/g, "")) || 0;
  const monthlyRent = Number(rentInput.replace(/,/g, "")) || 0;

  const downPaymentAmount = (homePrice * downPaymentPct) / 100;
  const loanPrincipal = homePrice - downPaymentAmount;
  const monthlyEmi = calculateEmi(loanPrincipal, mortgageRate, tenureYears);
  const monthsCompared = yearsToCompare * 12;
  const totalEmiPaid = monthlyEmi * Math.min(monthsCompared, tenureYears * 12);

  const remainingMonths = Math.max(0, tenureYears * 12 - monthsCompared);
  const remainingLoanBalance =
    remainingMonths > 0 && mortgageRate > 0
      ? (monthlyEmi * (1 - Math.pow(1 + mortgageRate / 12 / 100, -remainingMonths))) / (mortgageRate / 12 / 100)
      : 0;

  const propertyValueAtEnd = homePrice * Math.pow(1 + appreciationPct / 100, yearsToCompare);
  const buyNetPosition = propertyValueAtEnd - remainingLoanBalance - downPaymentAmount - totalEmiPaid;

  let totalRentPaid = 0;
  let currentRent = monthlyRent * 12;
  for (let year = 0; year < yearsToCompare; year++) {
    totalRentPaid += currentRent;
    currentRent *= 1 + rentIncreasePct / 100;
  }

  const downPaymentInvestmentValue = downPaymentAmount * Math.pow(1 + INVESTMENT_RETURN_RATE / 100, yearsToCompare);
  const rentNetPosition = downPaymentInvestmentValue - totalRentPaid;

  const difference = buyNetPosition - rentNetPosition;
  const buyingWins = difference >= 0;

  return (
    <div>
      <div>
        <label className="block text-sm font-semibold text-black" htmlFor="rvb-price">
          Home Price (PKR)
        </label>
        <input
          id="rvb-price"
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
        <label className="block text-sm font-semibold text-black" htmlFor="rvb-down">
          Down Payment ({downPaymentPct}%)
        </label>
        <input
          id="rvb-down"
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

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black" htmlFor="rvb-rate">
          Mortgage Rate ({mortgageRate}%)
        </label>
        <input
          id="rvb-rate"
          type="range"
          min={15}
          max={30}
          step={0.5}
          value={mortgageRate}
          onChange={(event) => setMortgageRate(Number(event.target.value))}
          className="mt-2 w-full accent-secondary"
        />
      </div>

      <div className="mt-4">
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

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black" htmlFor="rvb-rent">
          Monthly Rent (PKR)
        </label>
        <input
          id="rvb-rent"
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
        <label className="block text-sm font-semibold text-black" htmlFor="rvb-rent-increase">
          Annual Rent Increase ({rentIncreasePct}%)
        </label>
        <input
          id="rvb-rent-increase"
          type="range"
          min={0}
          max={15}
          value={rentIncreasePct}
          onChange={(event) => setRentIncreasePct(Number(event.target.value))}
          className="mt-2 w-full accent-secondary"
        />
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-black">Years to Compare</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {YEARS_OPTIONS.map((years) => (
            <button
              key={years}
              type="button"
              onClick={() => setYearsToCompare(years)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                yearsToCompare === years ? "bg-primary text-white" : "border border-primary bg-white text-black"
              }`}
            >
              {years}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black" htmlFor="rvb-appreciation">
          Expected Property Appreciation ({appreciationPct}%)
        </label>
        <input
          id="rvb-appreciation"
          type="range"
          min={0}
          max={20}
          value={appreciationPct}
          onChange={(event) => setAppreciationPct(Number(event.target.value))}
          className="mt-2 w-full accent-secondary"
        />
      </div>

      <div className="mt-6 rounded-xl bg-primary p-6 text-center">
        <p className="text-2xl font-bold text-secondary">{buyingWins ? "Buying" : "Renting"} Wins</p>
        <p className="text-4xl font-bold text-secondary">PKR {formatNumber(Math.abs(difference))}</p>
        <p className="mt-2 text-sm text-white">
          {buyingWins ? "Buying" : "Renting"} is better by this amount over {yearsToCompare} years
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div
          className={`rounded-xl border p-4 ${buyingWins ? "border-2 border-secondary bg-white" : "border-primary bg-white"}`}
        >
          <p className="text-sm font-bold text-black">Buy</p>
          <div className="mt-2 space-y-1 text-xs text-primary-mid">
            <p>Monthly EMI: PKR {formatNumber(monthlyEmi)}</p>
            <p>Total EMI Paid: PKR {formatNumber(totalEmiPaid)}</p>
            <p>Property Value: PKR {formatNumber(propertyValueAtEnd)}</p>
            <p className="font-semibold text-black">Net Position: PKR {formatNumber(buyNetPosition)}</p>
          </div>
        </div>
        <div
          className={`rounded-xl border p-4 ${!buyingWins ? "border-2 border-secondary bg-white" : "border-primary bg-white"}`}
        >
          <p className="text-sm font-bold text-black">Rent</p>
          <div className="mt-2 space-y-1 text-xs text-primary-mid">
            <p>Total Rent Paid: PKR {formatNumber(totalRentPaid)}</p>
            <p>Down Payment Invested: PKR {formatNumber(downPaymentInvestmentValue)}</p>
            <p className="font-semibold text-black">Net Position: PKR {formatNumber(rentNetPosition)}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-primary-mid">
        * Simplified model. Excludes taxes, maintenance, insurance. Consult a financial advisor.
      </p>
    </div>
  );
}
