import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RENT_SUFFIX: Record<"monthly" | "weekly" | "daily", string> = {
  monthly: "/mo",
  weekly: "/week",
  daily: "/day",
};

// Pakistani real-estate convention: abbreviate to Crore/Lac for sale prices,
// keep rent prices as a plain per-period figure (they rarely cross a lac).
// rentalPeriod defaults to "monthly" so existing callers that don't pass it
// keep showing "/mo" exactly as before.
export function formatPkrPrice(
  amount: number,
  purpose: "buy" | "rent" = "buy",
  rentalPeriod: "monthly" | "weekly" | "daily" = "monthly",
): string {
  if (purpose === "rent") {
    return `PKR ${Math.round(amount).toLocaleString("en-PK")}${RENT_SUFFIX[rentalPeriod]}`;
  }

  if (amount >= 1_00_00_000) {
    return `PKR ${trimDecimal(amount / 1_00_00_000)} Cr`;
  }

  if (amount >= 1_00_000) {
    return `PKR ${trimDecimal(amount / 1_00_000)} Lac`;
  }

  return `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
}

function trimDecimal(value: number): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
}

// Shared by the agent CNIC input (components/dashboard/settings/
// SettingsClient.tsx, formats as-you-type) and the admin verification queue
// (components/admin/CNICVerificationCard.tsx, defensively re-formats
// whatever's stored in case it was ever saved unformatted).
export function formatCnic(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  return [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter(Boolean).join("-");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
