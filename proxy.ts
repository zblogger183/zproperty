import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLATFORM_HOSTS = new Set(["sarzameenz.com", "www.sarzameenz.com", "localhost:3000"]);

type Section = "admin" | "dashboard" | "buyer";

// Roles allowed into each section, and where to send anyone else who lands
// there — a fixed fallback per section, not each role's own "natural" home.
const SECTION_RULES: Record<Section, { allowedRoles: string[]; fallback: string }> = {
  admin: { allowedRoles: ["super_admin", "admin"], fallback: "/dashboard" },
  dashboard: { allowedRoles: ["agent", "developer"], fallback: "/buyer" },
  buyer: { allowedRoles: ["buyer"], fallback: "/dashboard" },
};

const ROLE_COOKIE_NAME = "sz_role";
const ROLE_COOKIE_MAX_AGE_SECONDS = 60 * 15;

function getSection(pathname: string): Section | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/buyer")) return "buyer";
  return null;
}

// The role cookie is only a perf cache for this middleware's route gating —
// actual data access is still governed by Postgres RLS regardless of what
// this cookie says. It's still HMAC-signed (keyed off the service-role
// secret, server-only) so a tampered value is rejected rather than trusted,
// instead of caching the role as plain, forgeable text.
function signRole(userId: string, role: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", secret).update(`${userId}:${role}`).digest("hex");
}

function readCachedRole(request: NextRequest, userId: string): string | null {
  const raw = request.cookies.get(ROLE_COOKIE_NAME)?.value;
  if (!raw) return null;

  const [cachedUserId, role, signature] = raw.split(":");
  if (!cachedUserId || !role || !signature || cachedUserId !== userId) return null;

  const expected = Buffer.from(signRole(cachedUserId, role));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  return role;
}

function writeCachedRole(response: NextResponse, userId: string, role: string) {
  response.cookies.set(ROLE_COOKIE_NAME, `${userId}:${role}:${signRole(userId, role)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ROLE_COOKIE_MAX_AGE_SECONDS,
  });
}

// Redirects must carry forward any cookies already staged on `response`
// (Supabase's refreshed session tokens, or a role cookie we just wrote) —
// returning a bare NextResponse.redirect() here would silently drop them.
function redirectPreservingCookies(url: URL, response: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the auth session so server components always see a valid token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // White-label detection: any host not in PLATFORM_HOSTS is treated as a
  // custom/tenant domain and forwarded via header for downstream lookups.
  const host = request.headers.get("host") ?? "";
  const isWhiteLabel = !PLATFORM_HOSTS.has(host);
  response.headers.set("x-tenant-host", host);
  response.headers.set("x-white-label", String(isWhiteLabel));

  const pathname = request.nextUrl.pathname;

  // ── REDIRECT CHECK ──────────────────────────────────────
  // Only checks public-facing paths — assets, auth, dashboard, admin, and
  // api routes are skipped. This must run before the section-gating below:
  // `if (!section) return response` (further down) already exits early for
  // every path that ISN'T /admin, /dashboard, or /buyer — i.e. exactly the
  // public marketing/listing paths admin-configured redirects are meant to
  // cover. Placing this check after that gating (as originally drafted)
  // would make it dead code for its entire intended audience.
  // TODO: cache the redirects table in memory at scale — this adds one
  // extra DB round trip per public page view.
  const skipRedirectCheck =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/buyer") ||
    pathname.startsWith("/callback") ||
    pathname.includes("."); // static files (.ico, .png etc)

  if (!skipRedirectCheck) {
    const adminClient = createAdminClient();
    const { data: redirect } = await adminClient
      .from("redirects")
      .select("to_path, type")
      .eq("from_path", pathname)
      .eq("is_active", true)
      .maybeSingle(); // returns null (not error) if no match

    if (redirect) {
      // Fire-and-forget hit-count increment. (Not `.update({ hit_count:
      // adminClient.rpc(...) })` — a query builder isn't a value you can
      // assign to a column; the RPC call itself is what needs to fire.)
      // supabase-js query builders are "thenable" (implement `.then()`) but
      // not real Promises, so `.then().catch()` doesn't typecheck — the
      // two-argument form of `.then()` works on any thenable.
      adminClient.rpc("increment_hit_count", { redirect_path: pathname }).then(
        () => {},
        () => {},
      );

      const destination = redirect.to_path.startsWith("http")
        ? redirect.to_path
        : new URL(redirect.to_path, request.url).toString();

      return NextResponse.redirect(destination, { status: redirect.type as 301 | 302 });
    }
  }
  // ── END REDIRECT CHECK ──────────────────────────────────

  // The OAuth/recovery code-exchange route must never be gated — it's the
  // one place an unauthenticated request is expected to land mid-flow.
  if (pathname.startsWith("/callback")) {
    return response;
  }

  const section = getSection(pathname);
  if (!section) {
    return response;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return redirectPreservingCookies(loginUrl, response);
  }

  let role = readCachedRole(request, user.id);

  if (!role) {
    const { data, error } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

    if (error || !data?.role) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return redirectPreservingCookies(loginUrl, response);
    }

    role = data.role as string;
    writeCachedRole(response, user.id, role);
  }

  const { allowedRoles, fallback } = SECTION_RULES[section];
  if (!allowedRoles.includes(role)) {
    const fallbackUrl = request.nextUrl.clone();
    fallbackUrl.pathname = fallback;
    return redirectPreservingCookies(fallbackUrl, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
