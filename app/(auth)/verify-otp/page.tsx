import { AuthCard } from "@/components/auth/AuthCard";
import { VerifyOtpForm } from "./VerifyOtpForm";

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
