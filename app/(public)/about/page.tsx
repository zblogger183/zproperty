import type { Metadata } from "next";
import Link from "next/link";
import { StatsBar } from "@/components/portal/home/StatsBar";
import { getHomeStats } from "@/lib/stats";
import { resolvePageSeo } from "@/lib/seo/pageSeoOverride";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageSeo("/about", {
    title: "About ZProperty.pk — Pakistan Real Estate Platform",
    description:
      "ZProperty.pk is Pakistan's next-generation real estate platform, connecting buyers, sellers, and agents across Lahore, Karachi, and Islamabad.",
  });
}

const PILLARS = [
  {
    title: "Property Portal",
    description:
      "Verified listings from CNIC-checked agents, with transparent pricing, real photos, and direct WhatsApp contact — no middlemen, no fake listings.",
  },
  {
    title: "Digital Marketing",
    description:
      "Featured placements, boosted visibility, and growth services that help agents and developers reach serious buyers faster.",
  },
  {
    title: "Software & AI",
    description:
      "Automation tools for lead management, CRM pipelines, and SEO — built to save agents time and help them close more deals.",
  },
];

export default async function AboutUsPage() {
  const stats = await getHomeStats();

  return (
    <>
      <div className="bg-primary py-12 text-center">
        <h1 className="text-3xl font-bold text-white">About ZProperty.pk</h1>
        <p className="mt-2 text-base text-white/70">Pakistan&apos;s Real Estate Growth Ecosystem</p>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mb-4 text-2xl font-bold text-black">Our Mission</h2>
        <p className="text-base leading-relaxed text-black">
          ZProperty.pk is Pakistan&apos;s next-generation real estate platform, built to connect buyers, sellers,
          and agents across Lahore, Karachi, and Islamabad. We saw a market full of outdated listings, unverified
          agents, and buyers left guessing whether a property even existed — so we built a platform that fixes
          that from the ground up.
        </p>
        <p className="mt-4 text-base leading-relaxed text-black">
          Every agent on ZProperty.pk is CNIC-verified, every listing is moderated before it goes live, and
          every enquiry reaches a real person within minutes — not days. We combine a property portal with
          digital marketing services and purpose-built software, so agents and developers can grow their business
          without juggling five different tools.
        </p>
        <p className="mt-4 text-base leading-relaxed text-black">
          We&apos;re just getting started. Our goal is to become the platform Pakistani buyers trust by default,
          and the growth partner every serious agent and developer relies on.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="rounded-xl border border-primary bg-white p-6">
              <h3 className="text-base font-bold text-black">{pillar.title}</h3>
              <p className="mt-2 text-sm text-primary-mid">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>

      <StatsBar stats={stats} />

      <div className="py-12 text-center">
        <p className="text-lg font-semibold text-black">Want to partner with us?</p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-xl bg-secondary px-8 py-3 text-sm font-bold text-primary hover:bg-secondary-dark"
        >
          Get in Touch
        </Link>
      </div>
    </>
  );
}
