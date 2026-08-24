import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils/formatPrice";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zproperty.pk";
const SITE_NAME = "ZProperty.pk";
const SITE_DESC =
  "Pakistan's trusted real estate marketplace. Browse verified properties for sale and rent across Pakistan.";

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
      "plots for sale Islamabad",
      "property for sale Peshawar",
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
  floors?: number | null;
  description?: string | null;
  og_image_url?: string | null;
  area_name: string;
  city_name: string;
  society_name?: string | null;
  phase_name?: string | null;
  agent_name?: string | null;
  // CMS overrides (if set, use these instead of auto)
  meta_title?: string | null;
  meta_desc?: string | null;
  robots?: string | null;
  canonical_url?: string | null;
}

export function listingMeta(l: ListingMetaInput): Metadata {
  const purposeStr = l.purpose === "buy" ? "Sale" : "Rent";
  // "5 Marla Double Story House for Sale in DHA Phase 6, DHA, Lahore" — the
  // long-tail terms buyers actually type (size, floors, exact phase) go
  // straight into the auto-generated title, not just the description, since
  // this is what ranks for "5 marla house" / "double story house in DHA
  // phase 6" style searches whenever an agent hasn't set a custom meta_title.
  const areaStr = l.area_marla ? `${l.area_marla} Marla ` : "";
  const floorsStr = l.floors === 1 ? "Single Story " : l.floors === 2 ? "Double Story " : l.floors && l.floors >= 3 ? "Triple Story " : "";
  const bedsStr = l.beds ? `${l.beds} Bed ` : "";
  const typeStr = l.type.replace(/_/g, " ");
  const phaseLocation = [l.phase_name, l.society_name || l.area_name].filter(Boolean).join(", ");

  const autoTitle = `${areaStr}${floorsStr}${bedsStr}${typeStr} for ${purposeStr} in ${phaseLocation}, ${l.city_name} | ${SITE_NAME}`;
  const autoDesc = [
    areaStr.trim(),
    floorsStr.trim(),
    bedsStr.trim(),
    l.baths ? `${l.baths} bath` : null,
    typeStr,
    `for ${purposeStr.toLowerCase()}`,
    `in ${phaseLocation}, ${l.city_name}.`,
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
const FLOORS_LABEL: Record<number, string> = { 1: "Single Story", 2: "Double Story", 3: "Triple Story" };

export function searchMeta(params: {
  purpose: "buy" | "rent";
  type?: string | null;
  // Used only when `type` isn't set — a section like /plots or /commercial
  // spans several `type` values with none singularly "active", so without
  // this the title falls back to a generic "Property" even though the
  // on-page H1 says "Plot"/"Commercial Property".
  type_label_override?: string | null;
  area_name?: string | null;
  city_name: string;
  society_name?: string | null;
  phase_name?: string | null;
  min_area_marla?: number | null;
  max_area_marla?: number | null;
  floors?: number | null;
  count: number;
  canonicalUrl?: string;
  // Pre-launch, most filter combinations return 0 results — indexing those
  // as real pages would read as thin/doorway content to Google. `follow` is
  // still set so link equity flows through; only the page itself is excluded.
  noIndex?: boolean;
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
    : (params.type_label_override ?? "Property");
  const typeStr =
    params.count === 1
      ? typeSingular
      : typeSingular.endsWith("y")
        ? `${typeSingular.slice(0, -1)}ies`
        : `${typeSingular}s`;

  // "DHA Phase 6, Lahore" reads naturally; falls back to the society name
  // when there's no area (shouldn't normally happen — societies live under
  // an area) and finally to the bare city.
  const areaPhase = [params.area_name, params.phase_name].filter(Boolean).join(" ");
  const location = [areaPhase || params.society_name, params.city_name].filter(Boolean).join(", ");

  // Surfaces the exact long-tail terms buyers actually type — "5 Marla",
  // "Double Story" — in both the indexed title and meta description whenever
  // those filters are active, rather than only ever showing a generic
  // "Houses for Sale in Lahore" regardless of what was searched for.
  const sizeStr =
    params.min_area_marla != null && params.max_area_marla != null
      ? params.min_area_marla === params.max_area_marla
        ? `${params.min_area_marla} Marla `
        : `${params.min_area_marla}-${params.max_area_marla} Marla `
      : params.min_area_marla != null
        ? `${params.min_area_marla}+ Marla `
        : params.max_area_marla != null
          ? `Up to ${params.max_area_marla} Marla `
          : "";
  const floorsStr = params.floors != null ? `${FLOORS_LABEL[params.floors] ?? `${params.floors}-Story`} ` : "";
  const descriptor = `${sizeStr}${floorsStr}`;

  const title = `${params.count.toLocaleString()} ${descriptor}${typeStr} for ${purposeStr} in ${location} | ${SITE_NAME}`;
  const desc = `Browse ${params.count.toLocaleString()} verified ${descriptor}${typeStr.toLowerCase()} for ${purposeStr.toLowerCase()} in ${location}. Filter by price, size, bedrooms. Contact CNIC-verified agents directly on ${SITE_NAME}.`;

  return baseMeta({
    title,
    description: desc,
    robots: params.noIndex ? { index: false, follow: true } : undefined,
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
const PROJECT_STATUS_LABEL: Record<string, string> = {
  pre_launch: "Pre-Launch",
  launching: "Launching Now",
  under_construction: "Under Construction",
  ready: "Ready to Move",
  completed: "Completed",
};

// A raw admin-entered address is usually plot/office-number-first
// ("Office No 203, 2nd Floor, Divine Mega 2, Airport Road, Lahore") - the
// last segment before the city is normally the actual locality/road name
// (what buyers search for), so that's what surfaces in the title/description
// rather than the full string or just the bare city.
function shortLocation(address: string | null | undefined, cityName: string): string {
  if (!address) return cityName;
  const segments = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !part.toLowerCase().includes(cityName.toLowerCase()));
  const locality = segments[segments.length - 1];
  return locality ? `${locality}, ${cityName}` : cityName;
}

export function projectMeta(project: {
  name: string;
  slug: string;
  property_type?: string | null;
  city_name: string;
  address?: string | null;
  status?: string | null;
  total_units?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  og_image_url?: string | null;
  cover_image_url?: string | null;
  meta_title?: string | null;
  meta_desc?: string | null;
}): Metadata {
  const typeStr = project.property_type?.replace(/_/g, " ") || "Property";
  const typeLabel = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
  const location = shortLocation(project.address, project.city_name);
  const statusLabel = project.status ? (PROJECT_STATUS_LABEL[project.status] ?? null) : null;
  const priceStr = project.min_price ? `From ${formatPrice(project.min_price, "buy")}` : null;

  const title =
    project.meta_title ||
    [
      `${project.name} —`,
      `New ${typeLabel} for Sale in ${location}`,
      priceStr ? `| ${priceStr}` : null,
      `| ${SITE_NAME}`,
    ]
      .filter(Boolean)
      .join(" ");

  const desc =
    project.meta_desc ||
    [
      `${project.name} is a new ${typeLabel.toLowerCase()} project for sale in ${location}.`,
      statusLabel ? `${statusLabel}.` : null,
      priceStr ? `${priceStr}.` : null,
      project.total_units ? `${project.total_units} units.` : null,
      `View floor plans, payment plan and developer contact on ${SITE_NAME}.`,
    ]
      .filter(Boolean)
      .join(" ");

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
