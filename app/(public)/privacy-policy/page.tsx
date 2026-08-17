import type { Metadata } from "next";
import { resolvePageSeo } from "@/lib/seo/pageSeoOverride";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageSeo("/privacy-policy", {
    title: "Privacy Policy | ZProperty.pk",
    description: "How ZProperty.pk collects, uses, and protects your personal information.",
  });
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-16">
      <h1 className="text-3xl font-bold text-black">Privacy Policy</h1>
      <p className="mt-2 text-sm text-primary-mid">Last updated: January 2026</p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Information We Collect</h2>
      <p className="text-base leading-relaxed text-black">
        We collect information you provide directly, such as your name, email address, phone number, and CNIC
        details when you register as an agent or developer. We also collect information automatically, including
        your IP address, browser type, and pages viewed, to help us improve the platform and detect abuse.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">How We Use Information</h2>
      <p className="text-base leading-relaxed text-black">
        We use your information to operate and improve ZProperty.pk, verify agent identities, connect buyers
        with agents, process payments, send transactional notifications (email, WhatsApp, and in-app), and
        respond to support requests. We do not sell your personal information to third parties.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Data Security</h2>
      <p className="text-base leading-relaxed text-black">
        We use industry-standard measures, including encrypted connections and role-based access controls, to
        protect your data. Access to sensitive records is restricted to authorized personnel only, and all
        administrative actions are logged.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">CNIC Image Security</h2>
      <p className="text-base leading-relaxed text-black">
        CNIC images submitted for agent verification are stored in a private, access-controlled storage bucket
        and are never publicly accessible. Only authorized ZProperty.pk administrators reviewing verification
        requests can view them, via short-lived, signed URLs. CNIC images are never shared with third parties and
        are not displayed anywhere on public pages.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Cookies</h2>
      <p className="text-base leading-relaxed text-black">
        We use cookies to keep you signed in, remember your preferences, and understand how the platform is used.
        You can disable cookies in your browser settings, though some features may not work correctly as a
        result.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Third Party Services</h2>
      <p className="text-base leading-relaxed text-black">
        We use trusted third-party providers for payments (JazzCash, EasyPaisa, Stripe), email delivery (Resend),
        and WhatsApp messaging (Meta Cloud API). These providers only receive the information necessary to
        perform their specific function and are bound by their own privacy and security obligations.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-bold text-black">Contact</h2>
      <p className="text-base leading-relaxed text-black">
        If you have questions about this Privacy Policy or how your data is handled, contact us at
        support@zproperty.pk.
      </p>
    </div>
  );
}
