const RENTAL_PERIOD_SUFFIX: Record<"monthly" | "weekly" | "daily", string> = {
  monthly: "/mo",
  weekly: "/week",
  daily: "/day",
};

// rentalPeriod defaults to "monthly" (not required) so every existing call
// site that only knows buy/rent — not yet fetching the newer rental_period
// column — keeps showing "/mo" exactly as before, unchanged.
export function formatPrice(
  price: number,
  purpose: "buy" | "rent",
  rentalPeriod: "monthly" | "weekly" | "daily" = "monthly",
): string {
  let formatted: string;
  if (price >= 10_000_000) {
    formatted = `PKR ${(price / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  } else if (price >= 100_000) {
    formatted = `PKR ${(price / 100_000).toFixed(1).replace(/\.0$/, "")} Lakh`;
  } else {
    formatted = `PKR ${price.toLocaleString("en-PK")}`;
  }
  return purpose === "rent" ? `${formatted}${RENTAL_PERIOD_SUFFIX[rentalPeriod]}` : formatted;
}
