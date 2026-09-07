"use client";

import { useState } from "react";

type Province = "punjab" | "sindh" | "kpk" | "balochistan" | "islamabad";

interface ProvinceRates {
  label: string;
  stampDutyPct: number;
  cvtPct: number;
  registrationPct: number;
  buyerWhtFilerPct: number;
  buyerWhtNonFilerPct: number;
  sellerWhtFilerPct: number;
  sellerWhtNonFilerPct: number;
}

// Withholding tax under Sections 236K (buyer) and 236C (seller) of the Income
// Tax Ordinance is a federal rate set by the Finance Act, not provincial --
// it's the same figure regardless of which province the property is in, so
// it's defined once here rather than repeated (and risking drift) per
// province below. FY 2026-27 rates per the Finance Act 2026 (effective July 1,
// 2026), which also dropped the old "late filer" middle tier -- see
// zproperty.pk/blog/pakistan-property-tax-changes-2026-27.
const FEDERAL_WHT_FY2026_27 = {
  buyerWhtFilerPct: 1.25,
  buyerWhtNonFilerPct: 10.5,
  sellerWhtFilerPct: 2.75,
  sellerWhtNonFilerPct: 11.5,
};

// Stamp duty / CVT / registration fee rates below are provincial and were not
// re-verified as part of the FY 2026-27 withholding tax update above --
// confirm current figures with the relevant provincial revenue authority
// before relying on them for an actual transaction.
const PROVINCE_RATES: Record<Province, ProvinceRates> = {
  punjab: {
    label: "Punjab",
    stampDutyPct: 3,
    cvtPct: 2,
    registrationPct: 1,
    ...FEDERAL_WHT_FY2026_27,
  },
  sindh: {
    label: "Sindh",
    stampDutyPct: 3,
    cvtPct: 0.5,
    registrationPct: 0.5,
    ...FEDERAL_WHT_FY2026_27,
  },
  kpk: {
    label: "Khyber Pakhtunkhwa",
    stampDutyPct: 3,
    cvtPct: 2,
    registrationPct: 1,
    ...FEDERAL_WHT_FY2026_27,
  },
  balochistan: {
    label: "Balochistan",
    stampDutyPct: 3,
    cvtPct: 2,
    registrationPct: 1,
    ...FEDERAL_WHT_FY2026_27,
  },
  islamabad: {
    label: "Islamabad",
    stampDutyPct: 1,
    cvtPct: 2,
    registrationPct: 1,
    ...FEDERAL_WHT_FY2026_27,
  },
};

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-PK");
}

export function StampDutyCalculator() {
  const [valueInput, setValueInput] = useState("10,000,000");
  const [province, setProvince] = useState<Province>("punjab");
  const [transactionType, setTransactionType] = useState<"purchase" | "transfer" | "gift">("purchase");
  const [isFiler, setIsFiler] = useState(true);

  const value = Number(valueInput.replace(/,/g, "")) || 0;
  const rates = PROVINCE_RATES[province];

  const stampDuty = (value * rates.stampDutyPct) / 100;
  const cvt = (value * rates.cvtPct) / 100;
  const registration = (value * rates.registrationPct) / 100;
  const buyerWht = (value * (isFiler ? rates.buyerWhtFilerPct : rates.buyerWhtNonFilerPct)) / 100;

  const total = stampDuty + cvt + registration + buyerWht;

  return (
    <div>
      <div>
        <label className="block text-sm font-semibold text-black" htmlFor="sd-value">
          Property Value (PKR)
        </label>
        <input
          id="sd-value"
          value={valueInput}
          onChange={(event) => setValueInput(event.target.value)}
          onBlur={() => {
            const numeric = Number(valueInput.replace(/,/g, "")) || 0;
            setValueInput(numeric ? formatNumber(numeric) : "");
          }}
          inputMode="numeric"
          className="mt-1 w-full rounded-lg border border-primary px-3 py-2.5 text-sm text-black"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black" htmlFor="sd-province">
          Province
        </label>
        <select
          id="sd-province"
          value={province}
          onChange={(event) => setProvince(event.target.value as Province)}
          className="mt-1 w-full rounded-lg border border-primary bg-white px-3 py-2.5 text-sm text-black"
        >
          {(Object.keys(PROVINCE_RATES) as Province[]).map((key) => (
            <option key={key} value={key}>
              {PROVINCE_RATES[key].label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-primary-mid">
          Withholding tax rates for FY 2026-27 per the Finance Act 2026. Stamp duty, CVT, and registration fee
          rates are indicative -- verify all figures with FBR and your provincial authority before a transaction.
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-black" htmlFor="sd-type">
          Transaction Type
        </label>
        <select
          id="sd-type"
          value={transactionType}
          onChange={(event) => setTransactionType(event.target.value as typeof transactionType)}
          className="mt-1 w-full rounded-lg border border-primary bg-white px-3 py-2.5 text-sm text-black"
        >
          <option value="purchase">Purchase</option>
          <option value="transfer">Transfer</option>
          <option value="gift">Gift</option>
        </select>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-black">Are you a tax filer?</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setIsFiler(true)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
              isFiler ? "bg-primary text-white" : "border border-primary bg-white text-black"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setIsFiler(false)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
              !isFiler ? "bg-primary text-white" : "border border-primary bg-white text-black"
            }`}
          >
            No
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-2 rounded-xl border border-primary bg-white p-4">
        <div className="flex justify-between">
          <span className="text-sm text-primary-mid">Stamp Duty ({rates.stampDutyPct}%)</span>
          <span className="text-sm font-bold text-black">PKR {formatNumber(stampDuty)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-primary-mid">CVT ({rates.cvtPct}%)</span>
          <span className="text-sm font-bold text-black">PKR {formatNumber(cvt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-primary-mid">Registration Fee ({rates.registrationPct}%)</span>
          <span className="text-sm font-bold text-black">PKR {formatNumber(registration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-primary-mid">
            Withholding Tax — Buyer ({isFiler ? rates.buyerWhtFilerPct : rates.buyerWhtNonFilerPct}%)
          </span>
          <span className="text-sm font-bold text-black">PKR {formatNumber(buyerWht)}</span>
        </div>
        <div className="flex justify-between border-t border-primary pt-2">
          <span className="text-lg font-bold text-black">Total</span>
          <span className="text-lg font-bold text-black">PKR {formatNumber(total)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-primary p-6 text-center">
        <p className="text-sm text-white/70">Total Tax & Fees</p>
        <p className="text-4xl font-bold text-secondary">PKR {formatNumber(total)}</p>
      </div>

      <a
        href="https://fbr.gov.pk"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs text-primary underline"
      >
        Verify current rates at fbr.gov.pk
      </a>
    </div>
  );
}
