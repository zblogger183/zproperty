"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CreditCard, Landmark, Smartphone } from "lucide-react";

export interface SubscriptionPlanData {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number | null;
}

export interface RecentPayment {
  id: string;
  amount: number;
  method: "stripe" | "jazzcash" | "easypaisa" | "bank_transfer";
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  gateway_ref: string | null;
  initiated_at: string;
}

type PaymentMethodId = "jazzcash" | "easypaisa" | "stripe" | "bank_transfer";
type BillingCycle = "monthly" | "annual";

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["5 listings", "5 photos per listing", "Basic CRM"],
  pro: [
    "50 listings",
    "20 photos + video",
    "Full CRM pipeline",
    "CNIC verified badge",
    "2 featured credits/month",
    "Analytics",
  ],
  elite: [
    "Unlimited listings",
    "50 photos + video",
    "Advanced CRM",
    "WhatsApp bot",
    "5 featured credits/month",
    "Dedicated account manager",
  ],
};

const PAYMENT_METHODS: { id: PaymentMethodId; name: string; description: string; icon: typeof CreditCard }[] = [
  { id: "jazzcash", name: "JazzCash", description: "Pay via JazzCash wallet", icon: Smartphone },
  { id: "easypaisa", name: "EasyPaisa", description: "Pay via EasyPaisa", icon: Smartphone },
  { id: "stripe", name: "Credit/Debit Card", description: "Visa, Mastercard", icon: CreditCard },
  { id: "bank_transfer", name: "Bank Transfer", description: "Manual verification (1-2 days)", icon: Landmark },
];

const METHOD_BADGE_CLASSES: Record<RecentPayment["method"], string> = {
  stripe: "bg-primary text-white",
  jazzcash: "bg-primary text-white",
  easypaisa: "bg-primary text-white",
  bank_transfer: "bg-primary-mid text-white",
};

const STATUS_BADGE_CLASSES: Record<RecentPayment["status"], string> = {
  completed: "bg-secondary text-primary",
  pending: "border border-primary text-primary",
  processing: "border border-primary text-primary",
  failed: "border border-primary text-black",
  refunded: "border border-primary text-black",
};

// Hardcoded pending a real settings-table entry — see Part 5's redirects
// page for the same "documented gap, not implemented" pattern.
const BANK_DETAILS = {
  bankName: "Meezan Bank",
  accountTitle: "ZProperty Digital Services",
  accountNumber: "01234567890123",
  iban: "PK00MEZN0001234567890123",
};

export function SubscriptionClient({
  currentTier,
  subscriptionEnd,
  plans,
  recentPayments,
}: {
  currentTier: string;
  subscriptionEnd: string | null;
  plans: SubscriptionPlanData[];
  recentPayments: RecentPayment[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const errorParam = searchParams.get("error");

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [slipImageUrl, setSlipImageUrl] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankSubmitted, setBankSubmitted] = useState(false);

  const plan = plans.find((p) => p.slug === selectedPlan) ?? null;
  const amount = plan
    ? billingCycle === "annual"
      ? (plan.price_annual ?? plan.price_monthly)
      : plan.price_monthly
    : 0;

  // Date.now() is impure and can't be called during render (react-hooks/
  // purity) — this derives from the current wall-clock time, so it belongs
  // in an effect, not the render body.
  const [expiresSoon, setExpiresSoon] = useState(false);

  useEffect(() => {
    const msRemaining = subscriptionEnd ? new Date(subscriptionEnd).getTime() - Date.now() : null;
    // One-shot value derived from wall-clock time (Date.now(), impure —
    // can't be read during render). There's no prior render value to diff
    // against here, so the render-time "adjust state" pattern doesn't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpiresSoon(msRemaining != null && msRemaining > 0 && msRemaining < 30 * 24 * 60 * 60 * 1000);
  }, [subscriptionEnd]);

  async function handleSlipUpload(file: File) {
    setIsUploadingSlip(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "general");

      const response = await fetch("/api/upload/image", { method: "POST", body: formData });
      const result = (await response.json()) as { large_url?: string; error?: string };

      if (!response.ok || !result.large_url) {
        throw new Error(result.error ?? "Upload failed.");
      }

      setSlipImageUrl(result.large_url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploadingSlip(false);
    }
  }

  async function handleProceed() {
    if (!plan || !paymentMethod) return;
    setError(null);

    if ((paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && mobileNumber.trim().length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (paymentMethod === "bank_transfer" && !slipImageUrl) {
      setError("⚠ Please upload your payment receipt");
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === "jazzcash") {
        const response = await fetch("/api/payments/jazzcash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planSlug: plan.slug, billingCycle, mobileNumber: `92${mobileNumber.trim()}` }),
        });
        const result = (await response.json()) as {
          postUrl?: string;
          fields?: Record<string, string>;
          error?: string;
        };

        if (!response.ok || !result.postUrl || !result.fields) {
          throw new Error(result.error ?? "Failed to start JazzCash payment.");
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = result.postUrl;
        Object.entries(result.fields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (paymentMethod === "easypaisa") {
        const response = await fetch("/api/payments/easypaisa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planSlug: plan.slug, billingCycle }),
        });
        const result = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !result.url) {
          throw new Error(result.error ?? "Failed to start EasyPaisa payment.");
        }
        window.location.assign(result.url);
        return;
      }

      if (paymentMethod === "stripe") {
        const response = await fetch("/api/payments/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planSlug: plan.slug, billingCycle }),
        });
        const result = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !result.url) {
          throw new Error(result.error ?? "Failed to start card payment.");
        }
        router.push(result.url);
        return;
      }

      // bank_transfer
      const response = await fetch("/api/payments/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug, billingCycle, slipImageUrl }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Failed to submit transfer.");
      }
      setBankSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  }

  const proceedLabel = isProcessing
    ? "Processing..."
    : paymentMethod === "jazzcash"
      ? "Pay with JazzCash"
      : paymentMethod === "easypaisa"
        ? "Pay with EasyPaisa"
        : paymentMethod === "stripe"
          ? "Pay with Card"
          : paymentMethod === "bank_transfer"
            ? "Submit Transfer Receipt"
            : "Select a payment method";

  return (
    <div>
      {success && (
        <div className="mb-6 rounded-xl bg-secondary p-4 font-bold text-primary">
          ✓ Payment confirmed! Your {currentTier} plan is now active.
        </div>
      )}
      {errorParam === "payment_failed" && (
        <div className="mb-6 rounded-xl border border-primary p-4 font-medium text-black">
          ⚠ Payment was not completed. Please try again.
        </div>
      )}
      {errorParam === "cancelled" && (
        <p className="mb-6 text-sm text-primary-mid">Payment was cancelled. Your plan has not changed.</p>
      )}

      <div className="mb-6 flex items-center justify-between rounded-xl bg-primary p-5">
        <div>
          <p className="text-xs uppercase text-white/70">Current Plan</p>
          <p className="text-xl font-bold capitalize text-white">{currentTier}</p>
          <p className="text-sm text-white/70">
            {subscriptionEnd
              ? `Active until ${format(new Date(subscriptionEnd), "MMM d, yyyy")}`
              : "No active subscription"}
          </p>
        </div>
        {expiresSoon && (
          <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
            ⚠ Expires soon — Renew now
          </span>
        )}
      </div>

      <h2 className="mb-4 mt-6 text-xl font-bold text-black">Choose a Plan</h2>

      <div className="mb-4 inline-flex overflow-hidden rounded-lg border border-primary">
        <button
          type="button"
          onClick={() => setBillingCycle("monthly")}
          className={`px-5 py-2 text-sm font-semibold ${
            billingCycle === "monthly" ? "bg-primary text-white" : "bg-white text-primary"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle("annual")}
          className={`px-5 py-2 text-sm font-semibold ${
            billingCycle === "annual" ? "bg-primary text-white" : "bg-white text-primary"
          }`}
        >
          Annual (Save 17%)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isElite = p.slug === "elite";
          const isPro = p.slug === "pro";
          const isCurrent = p.slug === currentTier;
          const cardPrice = billingCycle === "annual" ? (p.price_annual ?? p.price_monthly) : p.price_monthly;

          return (
            <div key={p.id}>
              {isPro && (
                <span className="-mb-3 ml-4 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                  Most Popular
                </span>
              )}
              <div
                className={`rounded-xl p-5 ${
                  isElite
                    ? "border-2 border-primary bg-primary"
                    : isPro
                      ? "border-2 border-primary bg-white"
                      : "border border-primary bg-white"
                }`}
              >
                <p className={`text-base font-bold ${isElite ? "text-white" : "text-black"}`}>{p.name}</p>
                <p className={`text-3xl font-bold ${isElite ? "text-white" : "text-black"}`}>
                  PKR {cardPrice.toLocaleString("en-PK")}
                  <span className="text-sm font-normal">/{billingCycle === "annual" ? "year" : "month"}</span>
                </p>

                <ul className="mt-3 space-y-2">
                  {(PLAN_FEATURES[p.slug] ?? []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] text-primary">
                        ✓
                      </span>
                      <span className={`text-sm ${isElite ? "text-white" : "text-black"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="mt-4 w-full cursor-default rounded-lg border border-primary bg-white py-2.5 text-sm font-semibold text-primary-mid"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(p.slug)}
                    className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold ${
                      isElite
                        ? "bg-secondary font-bold text-primary"
                        : isPro
                          ? "bg-primary text-white"
                          : "border border-primary bg-white text-primary"
                    }`}
                  >
                    Select Plan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && selectedPlan !== currentTier && plan && (
        <div className="mt-8 rounded-xl border border-primary bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-black">Select Payment Method</h3>

          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`cursor-pointer rounded-xl border p-4 text-left transition ${
                    isSelected ? "border-2 border-secondary bg-white" : "border-primary bg-white"
                  }`}
                >
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <p className="mt-1 text-sm font-semibold text-black">{method.name}</p>
                  <p className="mt-0.5 text-xs text-primary-mid">{method.description}</p>
                </button>
              );
            })}
          </div>

          {(paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && (
            <div className="mt-3 flex items-center overflow-hidden rounded-lg border border-primary">
              <span className="bg-primary px-3 py-2.5 text-sm text-white">+92</span>
              <input
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="3001234567"
                className="flex-1 px-3 py-2.5 text-sm text-black outline-none"
              />
            </div>
          )}

          {paymentMethod === "bank_transfer" && (
            <div className="mt-3 rounded-xl border-2 border-primary bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-black">Transfer to this account:</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-primary-mid">Bank</span>
                  <span className="text-sm font-semibold text-black">{BANK_DETAILS.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-primary-mid">Account Title</span>
                  <span className="text-sm font-semibold text-black">{BANK_DETAILS.accountTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-primary-mid">Account Number</span>
                  <span className="text-sm font-semibold text-black">{BANK_DETAILS.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-primary-mid">IBAN</span>
                  <span className="text-sm font-semibold text-black">{BANK_DETAILS.iban}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-primary-mid">Amount</span>
                  <span className="text-sm font-semibold text-black">PKR {amount.toLocaleString("en-PK")}</span>
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold text-black">Upload payment receipt</p>
              {slipImageUrl ? (
                <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-primary">
                  <Image src={slipImageUrl} alt="Payment receipt" fill className="object-contain" />
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingSlip}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleSlipUpload(file);
                  }}
                  className="mt-2 text-sm text-black"
                />
              )}
              {isUploadingSlip && <p className="mt-1 text-xs text-primary-mid">Uploading...</p>}
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm font-medium text-black">
              <span aria-hidden="true">⚠ </span>
              {error}
            </p>
          )}

          {bankSubmitted ? (
            <p className="mt-6 rounded-lg bg-secondary p-3 text-center text-sm font-bold text-primary">
              ✓ Receipt submitted. We&apos;ll verify it within 1-2 business days.
            </p>
          ) : (
            <button
              type="button"
              disabled={isProcessing || !paymentMethod}
              onClick={() => void handleProceed()}
              className="mt-6 w-full rounded-lg bg-secondary py-3 text-sm font-bold text-primary hover:bg-secondary-dark disabled:opacity-60"
            >
              {proceedLabel}
            </button>
          )}
        </div>
      )}

      <h2 className="mb-4 mt-8 text-lg font-bold text-black">Payment History</h2>
      <div className="overflow-hidden rounded-xl border border-primary bg-white">
        <table className="w-full text-sm">
          <thead className="bg-primary text-xs text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Plan</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Method</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentPayments.map((payment) => (
              <tr key={payment.id} className="border-b border-primary">
                <td className="px-4 py-3 text-xs text-primary-mid">
                  {format(new Date(payment.initiated_at), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 text-sm capitalize text-black">
                  {(payment.gateway_ref ?? "—").split(":")[0]}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-black">
                  PKR {payment.amount.toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${METHOD_BADGE_CLASSES[payment.method]}`}
                  >
                    {payment.method.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${STATUS_BADGE_CLASSES[payment.status]}`}
                  >
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {recentPayments.length === 0 && (
          <p className="py-8 text-center text-sm text-primary-mid">No payment history yet.</p>
        )}
      </div>
    </div>
  );
}
