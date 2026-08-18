import type { NextConfig } from "next";

// script-src/style-src keep 'unsafe-inline' rather than a nonce-based setup:
// Next.js injects inline hydration/RSC-payload <script> tags and this app
// also renders inline JSON-LD <script> blocks (lib/seo/schemas.tsx,
// components/portal/Breadcrumb.tsx) via dangerouslySetInnerHTML — a strict
// script-src would need nonce plumbing through every one of those render
// paths. The directives below still close clickjacking (frame-ancestors),
// block plugin/object embedding, and restrict where forms/base tags can
// point, which is the bulk of the practical hardening a CSP buys here.
//
// 'unsafe-eval' is added in development only — Turbopack/React dev mode
// calls eval() to reconstruct stack traces for its debugging overlays, and
// without it the entire RSC payload fails to parse (confirmed live: every
// route 404'd until this was scoped in). React's own dev-mode warning
// confirms eval() is never used in production, so this never reaches prod.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://res.cloudinary.com https://*.supabase.co https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Listing/media images now come from Cloudinary (lib/image/cloudinary.ts)
      // rather than Supabase Storage — every next/image render of an
      // uploaded photo needs this or it throws at render time ("hostname
      // is not configured under images in next.config.js"). CNIC uploads
      // are unaffected (app/api/upload/cnic still writes to Supabase
      // Storage's private-documents bucket and is never rendered via
      // next/image).
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
