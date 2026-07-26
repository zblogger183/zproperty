export function formatPrice(price: number, purpose: "buy" | "rent"): string {
  let formatted: string;
  if (price >= 10_000_000) {
    formatted = `PKR ${(price / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  } else if (price >= 100_000) {
    formatted = `PKR ${(price / 100_000).toFixed(1).replace(/\.0$/, "")} Lakh`;
  } else {
    formatted = `PKR ${price.toLocaleString("en-PK")}`;
  }
  return purpose === "rent" ? `${formatted}/mo` : formatted;
}
