"use client";

import { useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { formatCnic } from "@/lib/utils";
import { submitCNICAction } from "@/app/dashboard/settings/actions";
import { CNICUploader } from "./CNICUploader";

const inputClass =
  "w-full border border-primary rounded-lg px-3 py-2.5 text-sm text-black bg-white placeholder:text-primary-mid focus:outline-none focus:border-secondary focus:border-2";
const labelClass = "block text-sm font-semibold text-black mb-1.5";

export interface SettingsProfile {
  cnic_number: string | null;
  cnic_front_url: string | null;
  cnic_back_url: string | null;
  cnic_verified: boolean;
  cnic_verified_at: string | null;
  subscription_tier: string;
}

interface NotificationPrefs {
  listingStatus: boolean;
  subscriptionExpiring: boolean;
  propertyAlerts: boolean;
}

export function SettingsClient({ profile, userEmail }: { profile: SettingsProfile; userEmail: string }) {
  // ── CNIC verification ──────────────────────────────────
  const [cnicNumber, setCnicNumber] = useState(profile.cnic_number ?? "");
  const [frontPath, setFrontPath] = useState<string | null>(profile.cnic_front_url);
  const [backPath, setBackPath] = useState<string | null>(profile.cnic_back_url);
  const [isSubmittingCnic, setIsSubmittingCnic] = useState(false);
  const [cnicSubmitted, setCnicSubmitted] = useState(false);
  const [cnicError, setCnicError] = useState<string | null>(null);

  const cnicSubmitDisabled = !cnicNumber || !frontPath || !backPath || isSubmittingCnic;

  async function handleSubmitCnic() {
    setIsSubmittingCnic(true);
    setCnicError(null);
    try {
      await submitCNICAction({
        cnic_number: cnicNumber,
        cnic_front_url: frontPath!,
        cnic_back_url: backPath!,
      });
      setCnicSubmitted(true);
    } catch (submitError) {
      setCnicError(submitError instanceof Error ? submitError.message : "Failed to submit for verification.");
    } finally {
      setIsSubmittingCnic(false);
    }
  }

  // ── Change password ────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleUpdatePassword() {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = createClient();

      // Re-verify the current password before allowing the change, rather
      // than trusting the field is correct without checking it — Supabase's
      // updateUser() doesn't itself require or verify the old password (an
      // active session is enough), so this is what actually makes the
      // "Current Password" field do something.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (signInError) {
        throw new Error("Current password is incorrect.");
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(updateError.message);

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (updateError) {
      setPasswordError(updateError instanceof Error ? updateError.message : "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  // ── Notification preferences ───────────────────────────
  // TODO: persist these — no preferences table/column exists yet. Once one
  // does (e.g. agent_profiles.notification_prefs JSONB), wire these toggles
  // to a server action instead of local-only state.
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    listingStatus: true,
    subscriptionExpiring: true,
    propertyAlerts: true,
  });

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
      <h1 className="text-2xl font-bold text-black">Settings</h1>

      {/* SECTION 1 — CNIC VERIFICATION */}
      <div className="rounded-xl border border-primary bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-black">CNIC Verification</h2>
          {profile.cnic_verified ? (
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">✓ Verified</span>
          ) : (
            <span className="rounded-full border border-primary bg-white px-3 py-1.5 text-xs text-primary-mid">
              Pending
            </span>
          )}
        </div>

        {profile.cnic_verified ? (
          <div className="mt-3 text-sm text-primary-mid">
            <p>
              Your CNIC was verified on{" "}
              {profile.cnic_verified_at ? format(new Date(profile.cnic_verified_at), "MMMM d, yyyy") : "—"}.
            </p>
            <p>Verified agents receive 3x more enquiries.</p>
          </div>
        ) : cnicSubmitted ? (
          <p className="mt-4 rounded-lg bg-secondary p-3 text-center text-sm font-semibold text-primary">
            ✓ Submitted for verification. We&apos;ll notify you once it&apos;s reviewed (usually 1-2 business days).
          </p>
        ) : (
          <>
            <div className="mt-4 border-l-4 border-secondary bg-white p-4">
              <p className="text-sm font-semibold text-black">Why verify your CNIC?</p>
              <ul className="mt-2 space-y-1 text-sm text-primary-mid">
                <li>• Verified badge on all your listings</li>
                <li>• 3x more enquiries from serious buyers</li>
                <li>• Higher ranking in search results</li>
                <li>• Required for Pro and Elite plan features</li>
              </ul>
            </div>

            <div className="mt-4">
              <label className={labelClass} htmlFor="cnic-number">
                CNIC Number
              </label>
              <input
                id="cnic-number"
                value={cnicNumber}
                onChange={(event) => setCnicNumber(formatCnic(event.target.value))}
                placeholder="00000-0000000-0"
                className={inputClass}
              />
            </div>

            <div className="mt-4">
              <p className={labelClass}>CNIC Front (National ID - Front)</p>
              <CNICUploader label="CNIC front" side="front" currentPath={frontPath} onUploaded={setFrontPath} />
            </div>

            <div className="mt-4">
              <p className={labelClass}>CNIC Back</p>
              <CNICUploader label="CNIC back" side="back" currentPath={backPath} onUploaded={setBackPath} />
            </div>

            {cnicError && (
              <p className="mt-3 text-sm font-medium text-black">
                <span aria-hidden="true">⚠ </span>
                {cnicError}
              </p>
            )}

            <button
              type="button"
              disabled={cnicSubmitDisabled}
              onClick={() => void handleSubmitCnic()}
              className="mt-4 w-full rounded-xl bg-secondary py-3 text-sm font-bold text-primary disabled:opacity-60"
            >
              {isSubmittingCnic ? "Submitting..." : "Submit for Verification"}
            </button>
            <p className="mt-2 text-center text-xs text-primary-mid">
              Verification usually takes 1-2 business days. You&apos;ll be notified via WhatsApp and in-app.
            </p>
          </>
        )}
      </div>

      {/* SECTION 2 — CHANGE PASSWORD */}
      <div className="rounded-xl border border-primary bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-black">Security</h2>

        <label className={labelClass} htmlFor="current-password">
          Current Password
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className={`${inputClass} mb-3`}
        />

        <label className={labelClass} htmlFor="new-password">
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className={`${inputClass} mb-3`}
        />

        <label className={labelClass} htmlFor="confirm-password">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={`${inputClass} mb-3`}
        />

        {passwordError && (
          <p className="mb-3 text-sm font-medium text-black">
            <span aria-hidden="true">⚠ </span>
            {passwordError}
          </p>
        )}
        {passwordSuccess && <p className="mb-3 text-sm font-medium text-black">✓ Password updated.</p>}

        <button
          type="button"
          disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
          onClick={() => void handleUpdatePassword()}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isUpdatingPassword ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* SECTION 3 — NOTIFICATION PREFERENCES */}
      <div className="rounded-xl border border-primary bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-black">Notification Preferences</h2>

        <div className="flex items-center justify-between border-b border-primary py-2">
          <div>
            <p className="text-sm text-black">New lead received</p>
            <p className="text-xs text-primary-mid">Always enabled</p>
          </div>
          <span className="h-5 w-10 rounded-full bg-secondary opacity-60" aria-hidden="true">
            <span className="block h-4 w-4 translate-x-5 rounded-full bg-white" />
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-primary py-2">
          <p className="text-sm text-black">Listing approved/rejected</p>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.listingStatus}
            onClick={() => toggle("listingStatus")}
            className={`h-5 w-10 cursor-pointer rounded-full transition-colors ${
              prefs.listingStatus ? "bg-secondary" : "bg-primary-mid"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                prefs.listingStatus ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-primary py-2">
          <p className="text-sm text-black">Subscription expiring</p>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.subscriptionExpiring}
            onClick={() => toggle("subscriptionExpiring")}
            className={`h-5 w-10 cursor-pointer rounded-full transition-colors ${
              prefs.subscriptionExpiring ? "bg-secondary" : "bg-primary-mid"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                prefs.subscriptionExpiring ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-2 last:border-b-0">
          <p className="text-sm text-black">Property alert matches</p>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.propertyAlerts}
            onClick={() => toggle("propertyAlerts")}
            className={`h-5 w-10 cursor-pointer rounded-full transition-colors ${
              prefs.propertyAlerts ? "bg-secondary" : "bg-primary-mid"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                prefs.propertyAlerts ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
