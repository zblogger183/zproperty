import type { Metadata } from "next";
import { resolvePageSeo } from "@/lib/seo/pageSeoOverride";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageSeo("/terms", {
    title: "Terms of Service | ZProperty.pk",
    description: "The terms and conditions governing use of ZProperty.pk.",
  });
}

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-16">
      <h1 className="text-3xl font-bold text-black">Terms of Service</h1>
      <p className="mt-2 text-sm text-primary-mid">Last updated: January 2026</p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Acceptance of Terms</h2>
      <p className="text-base leading-relaxed text-black">
        By accessing or using ZProperty.pk, you agree to be bound by these Terms of Service. If you do not
        agree with any part of these terms, please do not use the platform.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Listing Rules</h2>
      <p className="text-base leading-relaxed text-black">
        All listings must represent real, available properties. Fake, duplicate, or misleading listings are
        prohibited and will be removed. Prices must be accurate and reflect the actual asking price — bait
        pricing to attract enquiries is not allowed. Photos must be genuine images of the listed property.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Agent Responsibilities</h2>
      <p className="text-base leading-relaxed text-black">
        Agents are responsible for the accuracy of their listings and must respond to buyer enquiries in good
        faith. Agents must complete CNIC verification before receiving a verified badge and must not
        misrepresent their identity, agency affiliation, or credentials.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Payment Terms</h2>
      <p className="text-base leading-relaxed text-black">
        Subscription and featured-listing fees are billed in advance and are non-refundable except where required
        by law. Bank transfer payments are activated only after manual verification by our team, which may take
        up to 24 hours.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Prohibited Content</h2>
      <p className="text-base leading-relaxed text-black">
        You may not post content that is unlawful, fraudulent, discriminatory, or infringes on the rights of
        others. This includes listings for properties you do not have the legal right to sell or rent, and any
        content that violates Pakistani law.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Limitation of Liability</h2>
      <p className="text-base leading-relaxed text-black">
        ZProperty.pk is a platform that connects buyers, sellers, agents, and developers. We do not own, sell,
        or manage any property listed on the platform and are not a party to any transaction between users. We
        make reasonable efforts to verify agents and moderate listings but do not guarantee the accuracy of any
        listing or the conduct of any user.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Governing Law</h2>
      <p className="text-base leading-relaxed text-black">
        These Terms are governed by the laws of Pakistan. Any disputes arising from use of the platform shall be
        subject to the exclusive jurisdiction of the courts of Lahore, Pakistan.
      </p>
    </div>
  );
}
