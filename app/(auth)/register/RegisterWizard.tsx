"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, Home, KeyRound, Loader2, type LucideIcon } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormError } from "@/components/auth/FormError";
import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS } from "@/components/auth/styles";
import {
  registerStep1Schema,
  registerAgentDetailsSchema,
  registerDeveloperDetailsSchema,
  type RegisterStep1Input,
  type RegisterAgentDetailsInput,
  type RegisterDeveloperDetailsInput,
  type RegisterRole,
} from "../schemas";
import { registerAction } from "../actions";

type City = { id: string; name: string; slug: string };
type Step = 1 | 2 | 3;

const ROLE_OPTIONS: {
  role: RegisterRole;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
}[] = [
  {
    role: "buyer",
    title: "I'm looking to buy or rent",
    subtitle: "Browse and save properties",
    Icon: Home,
  },
  {
    role: "agent",
    title: "I'm a real estate agent",
    subtitle: "List and manage properties",
    Icon: KeyRound,
  },
  {
    role: "developer",
    title: "I'm a property developer",
    subtitle: "Showcase new projects",
    Icon: Building2,
  },
];

function formatCnic(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  return [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter(Boolean).join("-");
}

export function RegisterWizard({ cities }: { cities: City[] }) {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [step1Data, setStep1Data] = useState<RegisterStep1Input | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const step1Form = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const agentForm = useForm<RegisterAgentDetailsInput>({
    resolver: zodResolver(registerAgentDetailsSchema),
    defaultValues: { agencyName: "", city: "", experienceYears: "0-1", cnic: "" },
  });

  const developerForm = useForm<RegisterDeveloperDetailsInput>({
    resolver: zodResolver(registerDeveloperDetailsSchema),
    defaultValues: { companyName: "", city: "", website: "" },
  });

  function onSubmitStep1(values: RegisterStep1Input) {
    setStep1Data(values);
    setFormError(null);
    setStep(2);
  }

  function handleStep2Continue() {
    if (!role) {
      setFormError("Select an account type to continue.");
      return;
    }
    setFormError(null);
    setStep(3);
  }

  function submitBuyer() {
    if (!step1Data) return;
    startTransition(async () => {
      const result = await registerAction({ ...step1Data, role: "buyer" });
      if (result?.error) {
        setFormError(result.error);
        setStep(2);
      }
    });
  }

  useEffect(() => {
    if (step === 3 && role === "buyer") {
      submitBuyer();
    }
    // Only fires once when landing on step 3 as a buyer — buyers have no
    // details form, so registration is auto-submitted at that point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, role]);

  function onSubmitAgent(values: RegisterAgentDetailsInput) {
    if (!step1Data) return;
    setFormError(null);
    startTransition(async () => {
      const result = await registerAction({ ...step1Data, role: "agent", agent: values });
      if (result?.error) setFormError(result.error);
    });
  }

  function onSubmitDeveloper(values: RegisterDeveloperDetailsInput) {
    if (!step1Data) return;
    setFormError(null);
    startTransition(async () => {
      const result = await registerAction({ ...step1Data, role: "developer", developer: values });
      if (result?.error) setFormError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator step={step} />

      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(onSubmitStep1)} className="flex flex-col gap-4">
          <div>
            <label htmlFor="fullName" className={AUTH_LABEL_CLASS}>
              Full Name
            </label>
            <input
              id="fullName"
              className={AUTH_INPUT_CLASS}
              {...step1Form.register("fullName")}
            />
            <FormError message={step1Form.formState.errors.fullName?.message} />
          </div>

          <div>
            <label htmlFor="email" className={AUTH_LABEL_CLASS}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className={AUTH_INPUT_CLASS}
              {...step1Form.register("email")}
            />
            <FormError message={step1Form.formState.errors.email?.message} />
          </div>

          <div>
            <label htmlFor="phone" className={AUTH_LABEL_CLASS}>
              Phone Number
            </label>
            <div className="flex">
              <span className="flex items-center rounded-l-lg border-[1.5px] border-r-0 border-primary bg-white px-3 text-sm text-black">
                +92
              </span>
              <input
                id="phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="3001234567"
                className={`${AUTH_INPUT_CLASS} rounded-l-none`}
                {...step1Form.register("phone")}
              />
            </div>
            <FormError message={step1Form.formState.errors.phone?.message} />
          </div>

          <div>
            <label htmlFor="password" className={AUTH_LABEL_CLASS}>
              Password
            </label>
            <PasswordInput id="password" {...step1Form.register("password")} />
            <FormError message={step1Form.formState.errors.password?.message} />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={AUTH_LABEL_CLASS}>
              Confirm Password
            </label>
            <PasswordInput id="confirmPassword" {...step1Form.register("confirmPassword")} />
            <FormError message={step1Form.formState.errors.confirmPassword?.message} />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-primary transition hover:bg-secondary-dark"
          >
            Continue
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-1">
          {ROLE_OPTIONS.map((option) => (
            <RoleCard
              key={option.role}
              option={option}
              selected={role === option.role}
              onSelect={() => setRole(option.role)}
            />
          ))}

          <FormError message={formError} />

          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border-[1.5px] border-primary bg-white px-4 py-3 text-sm font-semibold text-primary"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStep2Continue}
              className="flex-1 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-primary transition hover:bg-secondary-dark"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && role === "buyer" && (
        <div className="flex flex-col items-center gap-3 py-6 text-sm text-black">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          Creating your account...
          <FormError message={formError} />
        </div>
      )}

      {step === 3 && role === "agent" && (
        <form onSubmit={agentForm.handleSubmit(onSubmitAgent)} className="flex flex-col gap-4">
          <div>
            <label htmlFor="agencyName" className={AUTH_LABEL_CLASS}>
              Agency Name (optional)
            </label>
            <input id="agencyName" className={AUTH_INPUT_CLASS} {...agentForm.register("agencyName")} />
          </div>

          <div>
            <label htmlFor="agentCity" className={AUTH_LABEL_CLASS}>
              City
            </label>
            <select id="agentCity" className={AUTH_INPUT_CLASS} {...agentForm.register("city")}>
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
            <FormError message={agentForm.formState.errors.city?.message} />
          </div>

          <div>
            <label htmlFor="experienceYears" className={AUTH_LABEL_CLASS}>
              How many years of experience?
            </label>
            <select
              id="experienceYears"
              className={AUTH_INPUT_CLASS}
              {...agentForm.register("experienceYears")}
            >
              <option value="0-1">0-1 years</option>
              <option value="2-5">2-5 years</option>
              <option value="6-10">6-10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </div>

          <div>
            <label htmlFor="cnic" className={AUTH_LABEL_CLASS}>
              CNIC Number
            </label>
            <Controller
              control={agentForm.control}
              name="cnic"
              render={({ field }) => (
                <input
                  id="cnic"
                  inputMode="numeric"
                  placeholder="00000-0000000-0"
                  className={AUTH_INPUT_CLASS}
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={(event) => field.onChange(formatCnic(event.target.value))}
                />
              )}
            />
            <FormError message={agentForm.formState.errors.cnic?.message} />
            <p className="mt-1 text-xs text-primary-mid">
              Your CNIC will be verified by our team within 24 hours.
            </p>
          </div>

          <FormError message={formError} />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border-[1.5px] border-primary bg-white px-4 py-3 text-sm font-semibold text-primary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && role === "developer" && (
        <form onSubmit={developerForm.handleSubmit(onSubmitDeveloper)} className="flex flex-col gap-4">
          <div>
            <label htmlFor="companyName" className={AUTH_LABEL_CLASS}>
              Company Name
            </label>
            <input
              id="companyName"
              className={AUTH_INPUT_CLASS}
              {...developerForm.register("companyName")}
            />
            <FormError message={developerForm.formState.errors.companyName?.message} />
          </div>

          <div>
            <label htmlFor="developerCity" className={AUTH_LABEL_CLASS}>
              City
            </label>
            <select id="developerCity" className={AUTH_INPUT_CLASS} {...developerForm.register("city")}>
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
            <FormError message={developerForm.formState.errors.city?.message} />
          </div>

          <div>
            <label htmlFor="website" className={AUTH_LABEL_CLASS}>
              Website (optional)
            </label>
            <input
              id="website"
              placeholder="https://"
              className={AUTH_INPUT_CLASS}
              {...developerForm.register("website")}
            />
            <FormError message={developerForm.formState.errors.website?.message} />
          </div>

          <FormError message={formError} />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border-[1.5px] border-primary bg-white px-4 py-3 text-sm font-semibold text-primary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-primary transition hover:bg-secondary-dark disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-[13px] text-black">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ["Your Info", "Account Type", "Details"];

  return (
    <div className="mb-6">
      <div className="flex items-center">
        {[1, 2, 3].map((index) => (
          <div key={index} className="flex flex-1 items-center last:flex-none">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                index < step
                  ? "bg-secondary text-primary"
                  : index === step
                    ? "bg-primary text-white"
                    : "border-[1.5px] border-primary bg-white text-black"
              }`}
            >
              {index < step ? <Check className="h-4 w-4" aria-hidden="true" /> : index}
            </div>
            {index < 3 && (
              <div
                className={`mx-2 h-[1.5px] flex-1 ${index < step ? "bg-secondary" : "bg-primary/30"}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-3 text-center">
        {labels.map((label, index) => (
          <span
            key={label}
            className={`text-[11px] ${index + 1 === step ? "font-bold text-primary" : "text-primary-mid"}`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RoleCard({
  option,
  selected,
  onSelect,
}: {
  option: (typeof ROLE_OPTIONS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const { Icon } = option;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mb-2.5 flex w-full items-center gap-3.5 rounded-[10px] border-[1.5px] border-primary px-5 py-4 text-left transition ${
        selected ? "bg-primary" : "bg-white"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-secondary" : "bg-primary"
        }`}
      >
        <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-white"}`} aria-hidden="true" />
      </div>
      <div>
        <p className={`text-sm font-semibold ${selected ? "text-white" : "text-black"}`}>{option.title}</p>
        <p className={`text-xs ${selected ? "text-secondary" : "text-primary-mid"}`}>{option.subtitle}</p>
      </div>
    </button>
  );
}
