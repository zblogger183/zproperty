import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WhatsAppButton({
  phone,
  message = "",
  className,
  children = "WhatsApp",
}: {
  phone: string | null | undefined;
  message?: string;
  className?: string;
  children?: ReactNode;
}) {
  if (!phone) {
    return (
      <span
        className={cn(
          "inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-secondary/40 px-4 py-2 text-sm font-bold text-primary",
          className,
        )}
      >
        {children}
      </span>
    );
  }

  const href = `https://wa.me/${phone.replace(/\D/g, "")}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary transition hover:bg-secondary-dark",
        className,
      )}
    >
      {children}
    </a>
  );
}
