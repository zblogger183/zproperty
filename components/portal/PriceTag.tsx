import { formatPkrPrice } from "@/lib/utils";

export function PriceTag({
  amount,
  purpose = "buy",
  className = "",
}: {
  amount: number;
  purpose?: "buy" | "rent";
  className?: string;
}) {
  return (
    <span className={`font-semibold text-primary ${className}`}>
      {formatPkrPrice(amount, purpose)}
    </span>
  );
}
