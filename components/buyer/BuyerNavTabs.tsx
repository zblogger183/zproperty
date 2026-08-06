"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Dashboard", href: "/buyer" },
  { label: "Saved Listings", href: "/buyer/saved" },
  { label: "Alerts", href: "/buyer/alerts" },
];

export function BuyerNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              active ? "bg-secondary text-primary" : "text-primary-mid hover:text-primary"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
