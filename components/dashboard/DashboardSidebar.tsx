"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  List,
  Plus,
  Inbox,
  Kanban,
  BarChart3,
  CreditCard,
  Zap,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { NotificationBell } from "@/components/shared/NotificationBell";

export interface DashboardUser {
  id: string;
  name: string;
  role: string;
}

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", Icon: Home },
  { label: "My Listings", href: "/dashboard/listings", Icon: List },
  { label: "Add Listing", href: "/dashboard/listings/new", Icon: Plus },
  { label: "Lead Inbox", href: "/dashboard/leads", Icon: Inbox },
  { label: "CRM", href: "/dashboard/crm", Icon: Kanban },
  { label: "Analytics", href: "/dashboard/analytics", Icon: BarChart3 },
  { label: "Subscription", href: "/dashboard/subscription", Icon: CreditCard },
  { label: "Boost Center", href: "/dashboard/boost", Icon: Zap },
  { label: "Settings", href: "/dashboard/settings", Icon: Settings },
];

export function DashboardSidebar({ user }: { user: DashboardUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  }

  const navContent = (
    <>
      <Link href="/" className="flex items-center gap-2 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-lg font-bold text-primary">
          S
        </span>
        <span className="text-base font-bold text-white">SarZameenz</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm ${
                active ? "bg-secondary font-bold text-primary" : "text-white hover:bg-primary-mid"
              }`}
            >
              <link.Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-primary-mid px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">{user.name}</p>
          <NotificationBell userId={user.id} iconClassName="text-white" />
        </div>
        <p className="text-xs capitalize text-white/70">{user.role}</p>
        <form action={signOutAction} className="mt-2">
          <button
            type="submit"
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <header className="flex h-14 items-center justify-between bg-primary px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-lg font-bold text-primary">
            S
          </span>
          <span className="text-base font-bold text-white">SarZameenz</span>
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell userId={user.id} iconClassName="text-white" />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-white"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col bg-primary md:flex">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex w-[220px] flex-col bg-primary">
            <div className="flex justify-end px-4 pt-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-white"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {navContent}
          </div>
          <div
            role="presentation"
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
