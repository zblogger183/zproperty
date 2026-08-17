const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zproperty.pk";
const SITE_NAME = "ZProperty.pk";
const LOGO_URL = `${SITE_URL}/logo.png`;

export function SchemaScript({ schema }: { schema: object | null }) {
  if (!schema) return null;
  // JSON.stringify alone can leave a literal `</script>` sequence intact if
  // any string field (listing description, agent bio, blog excerpt — all
  // user/CMS-supplied) contains one, breaking out of this script tag. Every
  // caller gets this escaping for free by going through SchemaScript, rather
  // than each call site needing its own safeJsonLd()-style helper.
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Pakistan's trusted real estate marketplace",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/buy/lahore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English", "Urdu"],
    },
    sameAs: ["https://facebook.com/zproperty", "https://instagram.com/zproperty"],
  };
}

export function breadcrumbSchema(items: Array<{ name: string; href?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: item.href.startsWith("http") ? item.href : `${SITE_URL}${item.href}` } : {}),
    })),
  };
}

export function listingSchema(params: {
  listing: {
    title: string;
    slug: string;
    purpose: string;
    type: string;
    price: number;
    beds?: number | null;
    baths?: number | null;
    area_sqft?: number | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    description?: string | null;
    primary_image_url?: string | null;
    published_at?: string | null;
    expires_at?: string | null;
  };
  agent: {
    name: string;
    profile_slug: string;
    whatsapp?: string | null;
  } | null;
  area_name: string;
  city_name: string;
}) {
  const { listing, agent, area_name, city_name } = params;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description ?? undefined,
    url: `${SITE_URL}/listing/${listing.slug}`,
    datePosted: listing.published_at ?? undefined,
    validThrough: listing.expires_at ?? undefined,
    price: String(listing.price),
    priceCurrency: "PKR",
    ...(listing.beds ? { numberOfRooms: listing.beds } : {}),
    ...(listing.baths ? { numberOfBathroomsTotal: listing.baths } : {}),
    ...(listing.area_sqft
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: listing.area_sqft,
            unitCode: "FTK",
          },
        }
      : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address ?? undefined,
      addressLocality: area_name,
      addressRegion: city_name,
      addressCountry: "PK",
    },
    ...(listing.lat && listing.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: listing.lat,
            longitude: listing.lng,
          },
        }
      : {}),
    ...(listing.primary_image_url ? { image: listing.primary_image_url } : {}),
    ...(agent
      ? {
          seller: {
            "@type": "RealEstateAgent",
            name: agent.name,
            url: `${SITE_URL}/agents/${agent.profile_slug}`,
          },
        }
      : {}),
  };
}

export function agentSchema(params: {
  name: string;
  profile_slug: string;
  headline?: string | null;
  bio?: string | null;
  whatsapp?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  avatar_url?: string | null;
  experience_years?: number;
  specialties?: string[];
}) {
  const sameAs = [params.facebook_url, params.instagram_url].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": ["Person", "RealEstateAgent"],
    name: params.name,
    description: params.bio ?? params.headline ?? undefined,
    url: `${SITE_URL}/agents/${params.profile_slug}`,
    image: params.avatar_url ?? undefined,
    telephone: params.whatsapp ? `+92${params.whatsapp.replace(/^0/, "")}` : undefined,
    knowsAbout: params.specialties ?? undefined,
    ...(sameAs.length ? { sameAs } : {}),
    worksFor: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function blogPostSchema(params: {
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_url?: string | null;
  og_image_url?: string | null;
  published_at?: string | null;
  updated_at?: string;
  author_name?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.excerpt ?? undefined,
    image: params.og_image_url ?? params.cover_url ?? undefined,
    datePublished: params.published_at ?? undefined,
    dateModified: params.updated_at,
    url: `${SITE_URL}/blog/${params.slug}`,
    mainEntityOfPage: `${SITE_URL}/blog/${params.slug}`,
    author: {
      "@type": "Person",
      name: params.author_name ?? SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
  };
}

export function areaGuideSchema(params: { society_name: string; pros?: string[]; cons?: string[] }) {
  const faqs = [
    ...(params.pros ?? []).map((pro) => ({
      "@type": "Question",
      name: `What are the advantages of ${params.society_name}?`,
      acceptedAnswer: { "@type": "Answer", text: pro },
    })),
    ...(params.cons ?? []).map((con) => ({
      "@type": "Question",
      name: `What are the drawbacks of ${params.society_name}?`,
      acceptedAnswer: { "@type": "Answer", text: con },
    })),
  ];
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs,
  };
}

export function projectSchema(params: {
  name: string;
  slug: string;
  description?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  cover_image_url?: string | null;
  og_image_url?: string | null;
  city_name: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: params.name,
    description: params.description ?? undefined,
    image: params.og_image_url ?? params.cover_image_url ?? undefined,
    url: `${SITE_URL}/new-projects/${params.slug}`,
    ...(params.min_price
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "PKR",
            lowPrice: params.min_price,
            highPrice: params.max_price ?? params.min_price,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}
