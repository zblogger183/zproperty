"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ZodTypeAny } from "zod";
import { StepIndicator } from "@/components/dashboard/StepIndicator";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
} from "@/app/dashboard/listings/schemas";
import { Step1Type } from "./Step1Type";
import { Step2Location } from "./Step2Location";
import { Step3Details } from "./Step3Details";
import { Step4Photos } from "./Step4Photos";
import { Step5Description } from "./Step5Description";
import { Step6Review } from "./Step6Review";
import type { AllFormData } from "./types";

const STEP_LABELS = ["Property Type", "Location", "Details", "Photos", "Description", "Review"];

// Parallel to STEP_LABELS by construction (both are 6-element, same order) —
// TypeScript can't verify a runtime index lines the two up, since neither
// `currentStep` nor the resulting `stepKey` are literal types. The cast at
// the call site below documents that assumption instead of threading a much
// larger discriminated-union type through the whole wizard for it.
const SCHEMAS: ZodTypeAny[] = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, step6Schema];
const STEP_KEYS: (keyof AllFormData)[] = ["step1", "step2", "step3", "step4", "step5", "step6"];

export function ListingForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AllFormData>({
    step1: {},
    step2: {},
    step3: {},
    step4: {},
    step5: {},
    step6: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateFormData<K extends keyof AllFormData>(step: K, data: Partial<AllFormData[K]>) {
    setFormData((prev) => ({ ...prev, [step]: { ...prev[step], ...data } }));
  }

  function validateCurrentStep(): boolean {
    const stepKey = STEP_KEYS[currentStep];
    const schema = SCHEMAS[currentStep];
    const result = schema.safeParse(formData[stepKey]);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    setFormData((prev) => ({ ...prev, [stepKey]: result.data as AllFormData[typeof stepKey] }));
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, STEP_LABELS.length - 1));
  }

  function handleBack() {
    setErrors({});
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        ...formData.step1,
        ...formData.step2,
        ...formData.step3,
        ...formData.step4,
        ...formData.step5,
        ...formData.step6,
      };

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not submit listing.");
      }

      router.push("/dashboard/listings?submitted=true");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-black">Add New Listing</h1>
      <StepIndicator steps={STEP_LABELS} currentStep={currentStep} />

      <div className="mt-6 rounded-xl border border-primary bg-white p-6">
        {currentStep === 0 && (
          <Step1Type
            data={formData.step1}
            errors={errors}
            onChange={(data) => updateFormData("step1", data)}
          />
        )}
        {currentStep === 1 && (
          <Step2Location
            data={formData.step2}
            errors={errors}
            onChange={(data) => updateFormData("step2", data)}
          />
        )}
        {currentStep === 2 && (
          <Step3Details
            data={formData.step3}
            errors={errors}
            propertyType={formData.step1.type}
            purpose={formData.step1.purpose}
            rentalPeriod={formData.step1.rental_period}
            onChange={(data) => updateFormData("step3", data)}
          />
        )}
        {currentStep === 3 && (
          <Step4Photos
            data={formData.step4}
            errors={errors}
            onChange={(data) => updateFormData("step4", data)}
          />
        )}
        {currentStep === 4 && (
          <Step5Description
            data={formData.step5}
            errors={errors}
            context={{ step1: formData.step1, step2: formData.step2, step3: formData.step3 }}
            onChange={(data) => updateFormData("step5", data)}
          />
        )}
        {currentStep === 5 && (
          <Step6Review
            formData={formData}
            errors={errors}
            onChangeSeo={(data) => updateFormData("step6", data)}
          />
        )}

        <div className="mt-8 flex justify-between">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-primary bg-white px-6 py-2.5 text-sm font-semibold text-primary"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {currentStep < STEP_LABELS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-secondary px-8 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary-dark"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-secondary px-8 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit for Review"}
            </button>
          )}
        </div>

        {submitError && (
          <p className="mt-3 text-sm font-medium text-black">
            <span aria-hidden="true">⚠ </span>
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
