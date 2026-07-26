"use client";

import { useState } from "react";

const SQFT_PER_MARLA = 272.25;
const SQFT_PER_KANAL = 5445;
const SQFT_PER_SQYARD = 9;
const SQFT_PER_SQMETER = 10.764;

type Unit = "marla" | "kanal" | "sqft" | "sqyard" | "sqmeter";

function toSqft(value: number, unit: Unit): number {
  switch (unit) {
    case "marla":
      return value * SQFT_PER_MARLA;
    case "kanal":
      return value * SQFT_PER_KANAL;
    case "sqyard":
      return value * SQFT_PER_SQYARD;
    case "sqmeter":
      return value * SQFT_PER_SQMETER;
    default:
      return value;
  }
}

function fromSqft(sqft: number, unit: Unit): number {
  switch (unit) {
    case "marla":
      return sqft / SQFT_PER_MARLA;
    case "kanal":
      return sqft / SQFT_PER_KANAL;
    case "sqyard":
      return sqft / SQFT_PER_SQYARD;
    case "sqmeter":
      return sqft / SQFT_PER_SQMETER;
    default:
      return sqft;
  }
}

function formatValue(value: number): string {
  if (!value) return "";
  return (Math.round(value * 100) / 100).toString();
}

const COMMON_SIZES = [
  { label: "3 Marla", sqft: 3 * SQFT_PER_MARLA },
  { label: "5 Marla", sqft: 5 * SQFT_PER_MARLA },
  { label: "8 Marla", sqft: 8 * SQFT_PER_MARLA },
  { label: "10 Marla", sqft: 10 * SQFT_PER_MARLA },
  { label: "1 Kanal", sqft: 1 * SQFT_PER_KANAL },
  { label: "2 Kanal", sqft: 2 * SQFT_PER_KANAL },
];

const FIELDS: { unit: Unit; label: string; badge: string }[] = [
  { unit: "marla", label: "Marla", badge: "Marla" },
  { unit: "kanal", label: "Kanal", badge: "Kanal" },
  { unit: "sqft", label: "Square Feet", badge: "Sqft" },
  { unit: "sqyard", label: "Square Yards", badge: "Sq Yd" },
  { unit: "sqmeter", label: "Square Meters", badge: "Sq M" },
];

export function AreaConverter() {
  const [sqft, setSqft] = useState<number>(0);

  function handleChange(unit: Unit, rawValue: string) {
    const value = Number(rawValue) || 0;
    setSqft(toSqft(value, unit));
  }

  return (
    <div>
      <div className="space-y-3">
        {FIELDS.map((field) => (
          <div key={field.unit} className="flex items-center">
            <label className="w-36 flex-shrink-0 text-sm font-semibold text-black" htmlFor={`area-${field.unit}`}>
              {field.label}
            </label>
            <input
              id={`area-${field.unit}`}
              type="number"
              value={formatValue(fromSqft(sqft, field.unit))}
              onChange={(event) => handleChange(field.unit, event.target.value)}
              className="flex-1 rounded-lg border border-primary px-3 py-2 text-sm text-black"
            />
            <span className="ml-2 flex-shrink-0 rounded bg-primary px-2 py-1 text-xs text-white">
              {field.badge}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-primary bg-white">
        <p className="border-b border-primary px-4 py-3 text-sm font-semibold text-black">Common Property Sizes</p>
        <table className="w-full text-left text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-2 font-semibold">Size</th>
              <th className="px-4 py-2 font-semibold">Sq Ft</th>
              <th className="px-4 py-2 font-semibold">Sq Meters</th>
            </tr>
          </thead>
          <tbody>
            {COMMON_SIZES.map((size) => (
              <tr key={size.label}>
                <td className="border-t border-primary px-4 py-2 font-semibold text-black">{size.label}</td>
                <td className="border-t border-primary px-4 py-2 text-primary-mid">
                  {formatValue(size.sqft)} sqft
                </td>
                <td className="border-t border-primary px-4 py-2 text-primary-mid">
                  {formatValue(size.sqft / SQFT_PER_SQMETER)} sq m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
