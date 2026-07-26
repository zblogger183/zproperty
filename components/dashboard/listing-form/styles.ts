import type { Step1Data } from "@/app/dashboard/listings/schemas";

export const inputClass =
  "w-full border border-primary rounded-lg px-3 py-2.5 text-sm text-black bg-white placeholder:text-primary-mid focus:outline-none focus:border-secondary focus:border-2";

export const labelClass = "block text-sm font-semibold text-black mb-1.5";

export const errorClass = "text-black text-xs font-medium mt-1";

// Shared between Step5Description (title suggestion) and Step6Review
// (summary card), so both display the same human-readable type name.
export const TYPE_LABELS: Record<Step1Data["type"], string> = {
  house: "House",
  flat: "Flat",
  upper_portion: "Upper Portion",
  lower_portion: "Lower Portion",
  room: "Room",
  residential_plot: "Residential Plot",
  commercial_plot: "Commercial Plot",
  agricultural_land: "Agricultural Land",
  office: "Office",
  shop: "Shop",
  warehouse: "Warehouse",
  building: "Building",
  other: "Property",
};
