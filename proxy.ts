import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLATFORM_HOSTS = new Set(["zproperty.pk", "www.zproperty.pk", "localhost:3000"]);

type Section = "admin" | "dashboard" | "buyer";

// Roles allowed into each section, and where to send anyone else who lands
// there — a fixed fallback per section, not each role's own "natural" home.
// `allowedRoles: null` means no restriction at all — any authenticated user
// may view that section (currently just /buyer: saved listings and alerts
// are meaningful for any logged-in visitor, not just the "buyer" role).
// This also guarantees the redirect chain always terminates: whichever
// section a mismatched role gets bounced to, /buyer accepts everyone, so
// there's no path that can bounce forever between sections.
const SECTION_RULES: Record<Section, { allowedRoles: string[] | null; fallback: string }> = {
  admin: { allowedRoles: ["super_admin", "admin"], fallback: "/dashboard" },
  dashboard: { allowedRoles: ["agent", "developer", "super_admin", "admin"], fallback: "/buyer" },
  buyer: { allowedRoles: null, fallback: "/dashboard" },
};

const ROLE_COOKIE_NAME = "sz_role";
// Short-lived on purpose: a stale cached role that still grants access is
// harmless (Postgres RLS is the real enforcement layer regardless of what
// this cookie says), but the code below also force-refreshes from the DB
// before ever acting on a cached role that would deny access — see the
// comment above that check. This TTL only bounds how long a *downgraded*
// role keeps its old section visible in the UI, not how fast an *upgrade*
// takes effect (that's immediate).
const ROLE_COOKIE_MAX_AGE_SECONDS = 60 * 2;

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
//
// Uses Web Crypto (`crypto.subtle`) rather than `node:crypto` deliberately —
// this file is Next's "proxy" (middleware), and on Cloudflare any Node-API
// usage here forces an experimental, explicitly "not officially maintained"
// Node-middleware bundling mode that also pulls Next's unrelated built-in
// `next/og` image renderer (and its ~1.4MB resvg.wasm) into the bundle even
// though this app never uses it. `crypto.subtle` is a standard Web API
// available in Node, Workers, and every other modern runtime, so this keeps
// proxy.ts on the regular (non-experimental) middleware path everywhere.
async function signRole(userId: string, role: string): Promise<string> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${userId}:${role}`));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// `node:crypto`'s timingSafeEqual requires equal-length buffers up front
// (hence the length check staying a separate, non-constant-time step here
// too, same as the original) — this reimplements just the constant-time
// byte comparison itself without the Node import, XOR-accumulating over
// every character so no early return leaks which byte first differed.
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function readCachedRole(request: NextRequest, userId: string): Promise<string | null> {
  const raw = request.cookies.get(ROLE_COOKIE_NAME)?.value;
  if (!raw) return null;

  const [cachedUserId, role, signature] = raw.split(":");
  if (!cachedUserId || !role || !signature || cachedUserId !== userId) return null;

  const expected = await signRole(cachedUserId, role);
  if (!timingSafeEqualHex(expected, signature)) return null;

  return role;
}

async function writeCachedRole(response: NextResponse, userId: string, role: string) {
  response.cookies.set(ROLE_COOKIE_NAME, `${userId}:${role}:${await signRole(userId, role)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ROLE_COOKIE_MAX_AGE_SECONDS,
  });
}

async function fetchRoleFromDb(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
  if (error || !data?.role) return null;
  return data.role as string;
}

// Redirects must carry forward any cookies already staged on `response`
// (Supabase's refreshed session tokens, or a role cookie we just wrote) —
// returning a bare NextResponse.redirect() here would silently drop them.
function redirectPreservingCookies(url: URL, response: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

// Next.js's own docs for this Proxy/middleware file are explicit: "since
// Proxy runs on every route, including prefetched routes, it's important to
// only read the session from the cookie (optimistic checks), and avoid
// database checks to prevent performance issues." This file was doing the
// opposite — a live supabase.auth.getUser() round trip (token refresh + user
// fetch) AND a `redirects` table lookup, unconditionally, on every matched
// request. Next.js's App Router automatically prefetches every <Link> that
// scrolls into view, and this site's footer/nav now link to dozens of
// distinct city/area/tool pages — so a single real pageview was fanning out
// into dozens of full middleware executions within the same second (confirmed
// live via Supabase's own request logs: ~28 near-simultaneous token-refresh +
// user-fetch pairs from one page load), each one a real network round trip.
// That fan-out is the direct cause of a production "Worker exceeded resource
// limits" (Cloudflare error 1102) outage with zero real traffic. Bailing out
// immediately for prefetch requests removes the fan-out multiplier entirely:
// the real navigation that follows a prefetch still runs this middleware in
// full, and /admin, /dashboard, /buyer all have their own independent
// server-side auth+role guard in their layout (see app/admin/layout.tsx),
// so skipping this file's gating on a background prefetch never bypasses
// real enforcement — at worst a prefetched RSC payload is itself a redirect.
function isPrefetchRequest(request: NextRequest): boolean {
  return (
    request.headers.get("next-router-prefetch") !== null ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose") === "prefetch"
  );
}

export async function proxy(request: NextRequest) {
  if (isPrefetchRequest(request)) {
    return NextResponse.next({ request });
  }

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

  let role = await readCachedRole(request, user.id);

  if (!role) {
    role = await fetchRoleFromDb(supabase, user.id);

    if (!role) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return redirectPreservingCookies(loginUrl, response);
    }

    await writeCachedRole(response, user.id, role);
  }

  const { allowedRoles, fallback } = SECTION_RULES[section];

  if (allowedRoles && !allowedRoles.includes(role)) {
    // The cache says this role is denied — but the cache can only ever be
    // as fresh as the last time it was written, and a role upgrade (e.g. an
    // admin promoting someone straight in the DB, bypassing the app) never
    // invalidates an already-cached cookie. Re-checking the DB here, right
    // before committing to a redirect, means a stale *denial* never lasts
    // longer than one request — only a stale *allow* can persist up to the
    // cookie's TTL, which is fine (RLS still governs real data access).
    const freshRole = await fetchRoleFromDb(supabase, user.id);

    if (freshRole && freshRole !== role) {
      role = freshRole;
      await writeCachedRole(response, user.id, role);
    }
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
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
