"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Clock,
  Star,
  FolderOpen,
  FileText,
  Map,
  Home,
  ImageIcon,
  Users,
  UserCheck,
  ShieldCheck,
  Search,
  ArrowRight,
  FileCode,
  CreditCard,
  Banknote,
  Receipt,
  Globe,
  BarChart2,
  Settings,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface AdminUser {
  id: string;
  name: string;
  role: string;
}

interface NavItem {
  label: string;
  href: string;
  Icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", Icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { label: "All Listings", href: "/admin/listings", Icon: List },
      { label: "Pending", href: "/admin/listings/pending", Icon: Clock },
      { label: "Featured", href: "/admin/listings/featured", Icon: Star },
      { label: "Projects", href: "/admin/projects", Icon: FolderOpen },
      { label: "Blog", href: "/admin/content/blog", Icon: FileText },
      { label: "Area Guides", href: "/admin/content/area-guides", Icon: Map },
      { label: "Homepage", href: "/admin/content/homepage", Icon: Home },
      { label: "Media", href: "/admin/media", Icon: ImageIcon },
    ],
  },
  {
    label: "Users",
    items: [
      { label: "All Users", href: "/admin/users", Icon: Users },
      { label: "Agents", href: "/admin/users/agents", Icon: UserCheck },
      { label: "CNIC Queue", href: "/admin/users/verification", Icon: ShieldCheck },
    ],
  },
  {
    label: "SEO",
    items: [
      { label: "Page SEO", href: "/admin/seo/pages", Icon: Search },
      { label: "Redirects", href: "/admin/seo/redirects", Icon: ArrowRight },
      { label: "Robots.txt", href: "/admin/seo/robots", Icon: FileCode },
    ],
  },
  {
    label: "Payments",
    items: [
      { label: "Transactions", href: "/admin/payments", Icon: CreditCard },
      { label: "Bank Transfers", href: "/admin/payments/bank-transfer", Icon: Banknote },
      { label: "Subscriptions", href: "/admin/payments/subscriptions", Icon: Receipt },
    ],
  },
  {
    label: "System",
    items: [
      { label: "White Label", href: "/admin/white-label", Icon: Globe },
      { label: "Analytics", href: "/admin/analytics", Icon: BarChart2 },
      { label: "Settings", href: "/admin/settings/general", Icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

export function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 border-b border-primary-mid px-4 py-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-base font-bold text-primary">
          S
        </span>
        <span className="text-sm font-bold text-white">SarZameenz</span>
        <span className="ml-auto rounded bg-primary-mid px-1.5 py-0.5 text-[10px] text-white">Admin</span>
      </div>

      <nav className="flex-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-4 pb-1 pt-5 text-[10px] font-bold uppercase tracking-widest text-white/70">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`mx-2 flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm transition ${
                    active ? "bg-secondary font-bold text-primary" : "text-white hover:bg-primary-mid"
                  }`}
                >
                  <item.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-primary-mid px-4 py-4">
        <p className="text-sm font-semibold text-white">{user.name}</p>
        <span className="mt-1 inline-block rounded bg-primary-mid px-2 py-0.5 text-xs capitalize text-white">
          {user.role}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 block cursor-pointer text-xs text-white/70 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-50 rounded-lg bg-primary p-2 text-white md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-56 flex-col overflow-y-auto bg-primary md:flex">
        {sidebarContent}
      </aside>

      <div
        className={`fixed inset-0 z-40 flex transition ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"} md:hidden`}
      >
        <aside
          className={`flex h-screen w-56 flex-col overflow-y-auto bg-primary transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex justify-end px-4 pt-4">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {sidebarContent}
        </aside>
        <div
          role="presentation"
          onClick={() => setMobileOpen(false)}
          className={`flex-1 bg-black/50 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </>
  );
}
