import type { Metadata } from "next";
import Link from "next/link";
import { resolvePageSeo } from "@/lib/seo/pageSeoOverride";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageSeo("/advertise", {
    title: "Advertise on ZProperty.pk — Real Estate Marketing Pakistan",
    description:
      "Reach Pakistan's property buyers with featured listings, banner advertising, and digital marketing services on ZProperty.pk.",
  });
}

const OPTIONS = [
  {
    title: "Featured Listings",
    price: "PKR 1,499 – 4,999",
    features: [
      "Top placement in search results",
      "Featured badge on your listing",
      "Up to 5x more views",
      "Choose 7, 15, or 30-day duration",
    ],
  },
  {
    title: "Banner Advertising",
    price: "Contact for rates",
    features: [
      "Homepage and search-page placements",
      "City or category targeting",
      "Custom creative support",
      "Monthly or campaign-based booking",
    ],
  },
  {
    title: "Digital Marketing Services",
    price: "From PKR 15,000/mo",
    features: [
      "Social media management",
      "Google & Meta ad campaigns",
      "Lead generation funnels",
      "Monthly performance reports",
    ],
  },
];

const STATS = [
  { value: "200,000+", label: "monthly visitors" },
  { value: "12,500+", label: "active listings" },
  { value: "2,800+", label: "registered agents" },
];

export default function AdvertiseWithUsPage() {
  return (
    <>
      <div className="bg-primary py-12 text-center">
        <h1 className="text-3xl font-bold text-white">Reach Pakistan&apos;s Property Buyers</h1>
        <p className="mt-2 text-base text-white/70">Advertising and growth services for agents and developers</p>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {OPTIONS.map((option) => (
            <div key={option.title} className="rounded-xl border border-primary bg-white p-6">
              <h2 className="text-lg font-bold text-black">{option.title}</h2>
              <p className="mt-1 text-base font-bold text-primary">{option.price}</p>
              <ul className="mt-4 space-y-2">
                {option.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-black">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-primary">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="mt-5 block rounded-lg bg-secondary py-2.5 text-center text-sm font-bold text-primary hover:bg-secondary-dark"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-secondary">{stat.value}</p>
              <p className="mt-1 text-sm text-white">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
