"use client";

import { useState } from "react";
import Link from "next/link";

const CONSTRUCTION_TYPES = [
  { value: "economy", label: "Economy", rate: 2500 },
  { value: "standard", label: "Standard", rate: 3500 },
  { value: "premium", label: "Premium", rate: 5000 },
  { value: "luxury", label: "Luxury", rate: 8000 },
] as const;

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-PK");
}

export function ConstructionCostCalculator() {
  const [areaInput, setAreaInput] = useState("2,722");
  const [constructionType, setConstructionType] = useState<(typeof CONSTRUCTION_TYPES)[number]["value"]>("standard");
  const [floors, setFloors] = useState(1);

  const area = Number(areaInput.replace(/,/g, "")) || 0;
  const rate = CONSTRUCTION_TYPES.find((type) => type.value === constructionType)!.rate;
  const baseCost = area * rate * floors;

  const structureCost = baseCost * 0.6;
  const finishingCost = baseCost * 0.25;
  const plumbingElectricCost = baseCost * 0.15;

  return (
    <div>
      <div>
        <label className="block text-sm font-semibold text-black" htmlFor="cc-area">
          Area (sqft)
        </label>
        <input
          id="cc-area"
          value={areaInput}
          onChange={(event) => setAreaInput(event.target.value)}
          onBlur={() => {
            const numeric = Number(areaInput.replace(/,/g, "")) || 0;
            setAreaInput(numeric ? formatNumber(numeric) : "");
          }}
          placeholder="e.g. 2722 (10 Marla)"
          inputMode="numeric"
          className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-black">Construction Type</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CONSTRUCTION_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setConstructionType(type.value)}
              className={`rounded-lg border p-3 text-left transition ${
                constructionType === type.value
                  ? "border-primary bg-primary text-white"
                  : "border-primary bg-white text-black hover:border-secondary"
              }`}
            >
              <p className="text-sm font-semibold">{type.label}</p>
              <p className={`mt-0.5 text-xs ${constructionType === type.value ? "text-secondary" : "text-primary-mid"}`}>
                PKR {formatNumber(type.rate)}/sqft
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-black">Floors</p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setFloors((value) => Math.max(1, value - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary text-lg font-bold text-primary"
            aria-label="Decrease floors"
          >
            −
          </button>
          <span className="w-6 text-center text-base font-bold text-black">{floors}</span>
          <button
            type="button"
            onClick={() => setFloors((value) => Math.min(5, value + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary text-lg font-bold text-primary"
            aria-label="Increase floors"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-primary p-6">
        <p className="text-sm text-white/70">Estimated Cost</p>
        <p className="text-4xl font-bold text-secondary">PKR {formatNumber(baseCost)}</p>
        <p className="mt-2 text-xs text-white">Actual cost may vary ±20% based on materials and location</p>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-white/70">Structure (60%)</span>
            <span className="text-sm font-semibold text-white">PKR {formatNumber(structureCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-white/70">Finishing (25%)</span>
            <span className="text-sm font-semibold text-white">PKR {formatNumber(finishingCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-white/70">Plumbing & Electric (15%)</span>
            <span className="text-sm font-semibold text-white">PKR {formatNumber(plumbingElectricCost)}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-primary-mid">* Rates based on Lahore 2025 market averages</p>

      <Link
        href="/forum"
        className="mt-5 inline-block rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-primary hover:bg-secondary-dark"
      >
        Find a Construction Contractor
      </Link>
    </div>
  );
}
