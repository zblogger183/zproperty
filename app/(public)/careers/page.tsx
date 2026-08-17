import type { Metadata } from "next";
import Link from "next/link";
import { resolvePageSeo } from "@/lib/seo/pageSeoOverride";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageSeo("/careers", {
    title: "Careers at ZProperty — Join Pakistan's Real Estate Platform",
    description: "Open roles and what it's like to work at ZProperty, Pakistan's real estate growth ecosystem.",
  });
}

const VALUES = [
  {
    title: "Build for real people",
    description: "Every feature we ship helps a buyer find a home or an agent close a deal faster.",
  },
  {
    title: "Move quickly",
    description: "Small teams, short feedback loops, and a product that ships continuously.",
  },
  {
    title: "Remote-friendly",
    description: "We hire across Pakistan and work async where it makes sense.",
  },
];

export default function CareersPage() {
  return (
    <>
      <div className="bg-primary py-12 text-center">
        <h1 className="text-3xl font-bold text-white">Careers at ZProperty</h1>
        <p className="mt-2 text-base text-white/70">Help build Pakistan&apos;s real estate growth ecosystem</p>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-xl border border-primary bg-white p-6">
              <h2 className="text-base font-bold text-black">{value.title}</h2>
              <p className="mt-2 text-sm text-primary-mid">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-primary bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-black">No open roles right now</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-primary-mid">
            We&apos;re not actively hiring at the moment, but we&apos;re growing. Send us your CV and what you&apos;d
            like to work on — we&apos;ll reach out when a fit opens up.
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-block rounded-lg bg-secondary px-6 py-3 text-sm font-bold text-primary hover:bg-secondary-dark"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </>
  );
}
