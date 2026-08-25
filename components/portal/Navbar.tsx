"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRoleRedirectPath } from "@/lib/auth/redirect";
import { signOutAction } from "@/lib/auth/actions";

export interface NavbarUser {
  name: string;
  role: string;
}

const NAV_LINKS = [
  { label: "Buy", href: "/buy/lahore", match: "/buy" },
  { label: "Rent", href: "/rent/lahore", match: "/rent" },
  { label: "New Projects", href: "/new-projects", match: "/new-projects" },
  { label: "Agents", href: "/agents", match: "/agents" },
  { label: "Blog", href: "/blog", match: "/blog" },
  { label: "Tools", href: "/tools/emi-calculator", match: "/tools" },
];

function isActive(pathname: string, match: string) {
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close both menus when the route changes. Done as a render-time state
  // adjustment (React's recommended pattern for "reset state when a value
  // changes") rather than an effect, which would cause an extra render pass.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setMenuOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auth state is fetched client-side (not in the layout) on purpose: a
  // server-side cookies() read here would force every static/ISR page under
  // app/(public) into fully dynamic rendering. This trades a brief
  // logged-out flash on first paint for keeping the rest of the site static.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadProfile(userId: string | null) {
      if (!userId) {
        if (active) setUser(null);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", userId)
        .maybeSingle();

      if (active) {
        setUser(data ? { name: data.name as string, role: data.role as string } : null);
      }
    }

    supabase.auth.getUser().then(({ data }) => loadProfile(data.user?.id ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const homePath = user ? getRoleRedirectPath(user.role) : "/";

  return (
    <header className="sticky top-0 z-50 h-14 w-full bg-primary">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/logo.png" alt="" width={26} height={32} className="h-8 w-auto" priority />
          <span className="text-lg font-bold text-white">ZProperty</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-2 pb-1 text-sm font-medium transition ${
                isActive(pathname, link.match)
                  ? "border-b-2 border-secondary text-secondary"
                  : "text-white hover:text-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-bold text-primary"
                aria-label="Account menu"
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-primary-mid bg-white shadow-lg">
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-black hover:bg-secondary/20"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Admin
                    </Link>
                  ) : (
                    <Link
                      href={homePath}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-black hover:bg-secondary/20"
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      Dashboard
                    </Link>
                  )}
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 border-t border-primary-mid/30 px-4 py-2.5 text-left text-sm text-black hover:bg-secondary/20"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-white/60 px-4 py-2 text-sm text-white transition hover:bg-primary-mid"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary transition hover:bg-secondary-dark"
              >
                + Add Property
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="text-white md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-primary p-6 md:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
              <Image src="/logo.png" alt="" width={26} height={32} className="h-8 w-auto" />
              <span className="text-lg font-bold text-white">ZProperty</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="text-white"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <nav className="mt-10 flex flex-col items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-lg ${
                  isActive(pathname, link.match) ? "text-secondary" : "text-white hover:text-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-10 flex flex-col items-center gap-3">
            {user ? (
              <>
                {isAdmin ? (
                  <Link href="/admin" className="text-white hover:text-secondary">
                    Admin
                  </Link>
                ) : (
                  <Link href={homePath} className="text-white hover:text-secondary">
                    Dashboard
                  </Link>
                )}
                <form action={signOutAction}>
                  <button type="submit" className="text-white hover:text-secondary">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-48 rounded-lg border border-white/60 px-4 py-2 text-center text-sm text-white hover:bg-primary-mid"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="w-48 rounded-lg bg-secondary px-4 py-2 text-center text-sm font-bold text-primary hover:bg-secondary-dark"
                >
                  + Add Property
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
