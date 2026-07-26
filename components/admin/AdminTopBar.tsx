"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/shared/NotificationBell";

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/listings": "All Listings",
  "/admin/listings/pending": "Pending Listings",
  "/admin/listings/featured": "Featured Listings",
  "/admin/projects": "Projects",
  "/admin/projects/pending": "Pending Projects",
  "/admin/content/blog": "Blog",
  "/admin/content/area-guides": "Area Guides",
  "/admin/content/homepage": "Homepage Sections",
  "/admin/content/navigation": "Navigation Links",
  "/admin/content/announcements": "Announcements",
  "/admin/media": "Media Library",
  "/admin/users": "All Users",
  "/admin/users/agents": "Agents",
  "/admin/users/buyers": "Buyers",
  "/admin/users/developers": "Developers",
  "/admin/users/verification": "CNIC Verification Queue",
  "/admin/seo/pages": "Page SEO",
  "/admin/seo/redirects": "Redirects",
  "/admin/seo/robots": "Robots.txt",
  "/admin/seo/sitemap": "Sitemap",
  "/admin/seo/schemas": "Schema.org Markup",
  "/admin/payments": "Transactions",
  "/admin/payments/bank-transfer": "Bank Transfers",
  "/admin/payments/subscriptions": "Subscriptions",
  "/admin/payments/invoices": "Invoices",
  "/admin/marketing/clients": "Marketing Clients",
  "/admin/white-label": "White Label",
  "/admin/analytics": "Analytics",
  "/admin/forum": "Forum Moderation",
  "/admin/settings/general": "General Settings",
  "/admin/settings/email": "Email Settings",
  "/admin/settings/plans": "Plans",
  "/admin/settings/payments": "Payment Settings",
  "/admin/settings/notifications": "Notification Settings",
};

export function AdminTopBar({ user }: { user: { id: string; name: string } }) {
  const pathname = usePathname();
  const title = ROUTE_TITLES[pathname] ?? "Admin";
  const initial = user.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-primary bg-white px-6">
      <h1 className="text-lg font-bold text-black">{title}</h1>

      <div className="flex items-center gap-3">
        <NotificationBell userId={user.id} iconClassName="text-primary" />
        <span className="text-sm text-black">{user.name}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-secondary">
          {initial}
        </span>
      </div>
    </header>
  );
}
