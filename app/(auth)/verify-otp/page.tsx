import type { Metadata } from "next";
import { baseMeta, SITE_URL } from "@/lib/seo/metadata";
import { AuthCard } from "@/components/auth/AuthCard";
import { VerifyOtpForm } from "./VerifyOtpForm";

// Canonicalizes to the bare path, not the identifier/purpose-bearing URL —
// the page content only differs by interpolated text, and self-canonicalizing
// to a URL carrying a specific email/phone would create one indexable URL per
// verification email sent rather than treating this as the one transactional page it is.
export const metadata: Metadata = baseMeta({
  title: "Verify Your Account | ZProperty.pk",
  description: "Enter the verification code sent to your email or phone to verify your ZProperty.pk account.",
  alternates: { canonical: `${SITE_URL}/verify-otp` },
});

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ identifier?: string; purpose?: string }>;
}) {
  const { identifier, purpose } = await searchParams;
  const resolvedPurpose = purpose === "login" ? "login" : "signup";

  return (
    <AuthCard
      title="Verify your account"
      subtitle={
        identifier
          ? `Enter the 6-digit code sent to ${identifier}`
          : "Enter the 6-digit code sent to you"
      }
    >
      <VerifyOtpForm identifier={identifier ?? ""} purpose={resolvedPurpose} />
    </AuthCard>
  );
}
