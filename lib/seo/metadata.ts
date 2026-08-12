import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils/formatPrice";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarzameenz.com";
const SITE_NAME = "SarZameenz.com";
const SITE_DESC =
  "Pakistan's trusted real estate marketplace. Browse verified properties for sale and rent in Lahore, Karachi and Islamabad.";

// ── BASE (used by all other generators) ──────────────────
export function baseMeta(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: { telephone: false },
    ...overrides,
  };
}

// ── HOMEPAGE ─────────────────────────────────────────────
export function homepageMeta(): Metadata {
  const title = `${SITE_NAME} — Find Properties in Pakistan`;
  const desc = SITE_DESC;
  return baseMeta({
    title,
    description: desc,
    keywords: [
      "property for sale Pakistan",
      "real estate Pakistan",
      "houses for sale Lahore",
      "flats for rent Karachi",
      "zameen",
      "property portal Pakistan",
    ],
    openGraph: {
      title,
      description: desc,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description: desc },
    alternates: { canonical: SITE_URL },
  });
}

// ── LISTING PAGE ─────────────────────────────────────────
export interface ListingMetaInput {
  title: string;
  slug: string;
  purpose: "buy" | "rent";
  type: string;
  price: number;
  beds?: number | null;
  baths?: number | null;
  area_marla?: number | null;
  description?: string | null;
  og_image_url?: string | null;
  area_name: string;
  city_name: string;
  agent_name?: string | null;
  // CMS overrides (if set, use these instead of auto)
  meta_title?: string | null;
  meta_desc?: string | null;
  robots?: string | null;
  canonical_url?: string | null;
}

export function listingMeta(l: ListingMetaInput): Metadata {
  const purposeStr = l.purpose === "buy" ? "Sale" : "Rent";
  const bedsStr = l.beds ? `${l.beds} Bed ` : "";
  const typeStr = l.type.replace(/_/g, " ");

  const autoTitle = `${bedsStr}${typeStr} for ${purposeStr} in ${l.area_name}, ${l.city_name} | ${SITE_NAME}`;
  const autoDesc = [
    bedsStr.trim(),
    l.baths ? `${l.baths} bath` : null,
    typeStr,
    `for ${purposeStr.toLowerCase()}`,
    `in ${l.area_name}, ${l.city_name}.`,
    l.area_marla ? `${l.area_marla} Marla.` : null,
    formatPrice(l.price, l.purpose) + ".",
    l.agent_name ? `Contact ${l.agent_name} on ${SITE_NAME}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const title = l.meta_title || autoTitle;
  const desc = l.meta_desc || autoDesc;
  const robots = l.robots || "index,follow";
  const canonical = l.canonical_url || `${SITE_URL}/listing/${l.slug}`;
  const ogImage = l.og_image_url || `${SITE_URL}/og-default.jpg`;

  return baseMeta({
    title,
    description: desc,
    robots: { index: !robots.includes("noindex"), follow: !robots.includes("nofollow") },
    openGraph: {
      title,
      description: desc,
      type: "website",
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [ogImage] },
    alternates: { canonical },
  });
}

// ── SEARCH / LISTING-COLLECTION PAGES ────────────────────
export function searchMeta(params: {
  purpose: "buy" | "rent";
  type?: string | null;
  area_name?: string | null;
  city_name: string;
  count: number;
  canonicalUrl?: string;
}): Metadata {
  const purposeStr = params.purpose === "buy" ? "Sale" : "Rent";
  // Was `params.type.replace(/_/g, " ") + "s"` — lowercase and grammatically
  // wrong for a count of 1 (e.g. "1 residential plots for Sale"). Title-cases
  // the type and only pluralizes when the count actually calls for it.
  const typeSingular = params.type
    ? params.type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Property";
  const typeStr =
    params.count === 1
      ? typeSingular
      : typeSingular.endsWith("y")
        ? `${typeSingular.slice(0, -1)}ies`
        : `${typeSingular}s`;
  const location = params.area_name ? `${params.area_name}, ${params.city_name}` : params.city_name;

  const title = `${params.count.toLocaleString()} ${typeStr} for ${purposeStr} in ${location} | ${SITE_NAME}`;
  const desc = `Browse ${params.count.toLocaleString()} verified ${typeStr.toLowerCase()} for ${purposeStr.toLowerCase()} in ${location}. Filter by price, size, bedrooms. Contact CNIC-verified agents directly on ${SITE_NAME}.`;

  return baseMeta({
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website", siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title, description: desc },
    ...(params.canonicalUrl ? { alternates: { canonical: params.canonicalUrl } } : {}),
  });
}

// ── BLOG POST ────────────────────────────────────────────
export function blogPostMeta(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  og_image_url?: string | null;
  cover_url?: string | null;
  published_at?: string | null;
  updated_at?: string;
  author_name?: string | null;
  meta_title?: string | null;
  meta_desc?: string | null;
  focus_keyword?: string | null;
  robots?: string | null;
  canonical_url?: string | null;
}): Metadata {
  const title = post.meta_title || `${post.title} | ${SITE_NAME} Blog`;
  const desc = post.meta_desc || post.excerpt || "";
  const canonical = post.canonical_url || `${SITE_URL}/blog/${post.slug}`;
  const ogImage = post.og_image_url || post.cover_url || `${SITE_URL}/og-default.jpg`;

  return baseMeta({
    title,
    description: desc,
    keywords: post.focus_keyword ? [post.focus_keyword] : undefined,
    openGraph: {
      title,
      description: desc,
      type: "article",
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : undefined,
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [ogImage] },
    alternates: { canonical },
  });
}

// ── AGENT PROFILE ────────────────────────────────────────
export function agentMeta(agent: {
  name: string;
  profile_slug: string;
  headline?: string | null;
  city_names?: string[];
  meta_title?: string | null;
  meta_desc?: string | null;
  og_image_url?: string | null;
}): Metadata {
  const cities = agent.city_names?.join(", ") || "Pakistan";
  const title = agent.meta_title || `${agent.name} — Real Estate Agent in ${cities} | ${SITE_NAME}`;
  const desc =
    agent.meta_desc ||
    agent.headline ||
    `${agent.name} is a verified real estate agent serving ${cities} on ${SITE_NAME}. Browse their listings and contact directly via WhatsApp.`;
  const ogImage = agent.og_image_url || `${SITE_URL}/og-default.jpg`;
  const canonical = `${SITE_URL}/agents/${agent.profile_slug}`;

  return baseMeta({
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "profile",
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description: desc },
    alternates: { canonical },
  });
}

// ── AREA GUIDE ───────────────────────────────────────────
export function areaGuideMeta(params: {
  society_name: string;
  city_name: string;
  city_slug: string;
  society_slug: string;
  meta_title?: string | null;
  meta_desc?: string | null;
}): Metadata {
  const title = params.meta_title || `${params.society_name} Area Guide — Properties, Prices & Reviews | ${SITE_NAME}`;
  const desc =
    params.meta_desc ||
    `Complete area guide for ${params.society_name}, ${params.city_name}. Property prices, amenities, pros & cons, and verified listings.`;
  const canonical = `${SITE_URL}/area-guide/${params.city_slug}/${params.society_slug}`;

  return baseMeta({
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website", siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title, description: desc },
    alternates: { canonical },
  });
}

// ── NEW PROJECT ──────────────────────────────────────────
export function projectMeta(project: {
  name: string;
  slug: string;
  property_type?: string | null;
  city_name: string;
  min_price?: number | null;
  max_price?: number | null;
  og_image_url?: string | null;
  cover_image_url?: string | null;
  meta_title?: string | null;
  meta_desc?: string | null;
}): Metadata {
  const typeStr = project.property_type?.replace(/_/g, " ") || "Properties";
  const priceStr = project.min_price ? `from ${formatPrice(project.min_price, "buy")}` : "";
  const title =
    project.meta_title ||
    `${project.name} — New ${typeStr} in ${project.city_name}${priceStr ? " " + priceStr : ""} | ${SITE_NAME}`;
  const desc =
    project.meta_desc ||
    `${project.name} is a new ${typeStr.toLowerCase()} development in ${project.city_name}. ${priceStr ? `Starting ${priceStr}.` : ""} Get details, payment plans and agent contact on ${SITE_NAME}.`;
  const ogImage = project.og_image_url || project.cover_image_url || `${SITE_URL}/og-default.jpg`;
  const canonical = `${SITE_URL}/new-projects/${project.slug}`;

  return baseMeta({
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [ogImage] },
    alternates: { canonical },
  });
}
