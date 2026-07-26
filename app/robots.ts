import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarzameenz.com";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("settings").select("value").eq("key", "robots_txt").single();

    // Settings stores the raw string value (not double-JSON-encoded) — see
    // app/admin/seo/actions.ts's saveRobotsTxtAction for why.
    const content = typeof data?.value === "string" ? data.value : "";

    if (!content) throw new Error("empty");

    // Parse text into structured Next.js robots format.
    // TODO: this parser handles one User-agent block only.
    // Multiple blocks are not supported — last block wins.
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const allows: string[] = [];
    const disallows: string[] = [];
    let userAgent = "*";

    for (const line of lines) {
      if (line.startsWith("User-agent:")) {
        userAgent = line.replace("User-agent:", "").trim();
      } else if (line.startsWith("Allow:")) {
        const value = line.replace("Allow:", "").trim();
        if (value) allows.push(value);
      } else if (line.startsWith("Disallow:")) {
        const value = line.replace("Disallow:", "").trim();
        if (value) disallows.push(value);
      }
    }

    return {
      rules: [
        {
          userAgent,
          ...(allows.length ? { allow: allows } : {}),
          ...(disallows.length ? { disallow: disallows } : {}),
        },
      ],
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  } catch {
    // Fallback if DB unavailable or setting missing.
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin/", "/dashboard/", "/buyer/", "/api/"],
        },
      ],
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  }
}
