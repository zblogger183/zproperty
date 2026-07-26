import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or phone number"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const otpIdentifierSchema = z.object({
  identifier: z.string().min(3, "Enter your email or phone number"),
});
export type OtpIdentifierInput = z.infer<typeof otpIdentifierSchema>;

export const registerStep1Schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit number (e.g. 3001234567)"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;

export const registerRoleSchema = z.enum(["buyer", "agent", "developer"]);
export type RegisterRole = z.infer<typeof registerRoleSchema>;

export const registerAgentDetailsSchema = z.object({
  agencyName: z.string().optional(),
  city: z.string().min(1, "Select a city"),
  experienceYears: z.enum(["0-1", "2-5", "6-10", "10+"]),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d$/, "Format: 00000-0000000-0"),
});
export type RegisterAgentDetailsInput = z.infer<typeof registerAgentDetailsSchema>;

export const registerDeveloperDetailsSchema = z.object({
  companyName: z.string().min(2, "Enter your company name"),
  city: z.string().min(1, "Select a city"),
  website: z.union([z.string().url("Enter a valid URL"), z.literal("")]).optional(),
});
export type RegisterDeveloperDetailsInput = z.infer<typeof registerDeveloperDetailsSchema>;

export const verifyOtpSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
