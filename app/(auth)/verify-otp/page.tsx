import type { Metadata } from "next";
import { baseMeta } from "@/lib/seo/metadata";
import { AuthCard } from "@/components/auth/AuthCard";
import { VerifyOtpForm } from "./VerifyOtpForm";

export const metadata: Metadata = baseMeta({
  title: "Verify Your Account | ZProperty.pk",
  description: "Enter the verification code sent to your email or phone to verify your ZProperty.pk account.",
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
