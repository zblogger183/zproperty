import { formatPkrPrice } from "@/lib/utils";

export function PriceTag({
  amount,
  purpose = "buy",
  rentalPeriod = "monthly",
  className = "",
}: {
  amount: number;
  purpose?: "buy" | "rent";
  rentalPeriod?: "monthly" | "weekly" | "daily";
  className?: string;
}) {
  return (
    <span className={`font-semibold text-primary ${className}`}>
      {formatPkrPrice(amount, purpose, rentalPeriod)}
    </span>
  );
}
