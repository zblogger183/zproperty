import { z } from "zod";

export const step1Schema = z.object({
  purpose: z.enum(["buy", "rent"]),
  type: z.enum([
    "house",
    "flat",
    "upper_portion",
    "lower_portion",
    "room",
    "residential_plot",
    "commercial_plot",
    "agricultural_land",
    "office",
    "shop",
    "warehouse",
    "building",
    "other",
  ]),
});

export const step2Schema = z.object({
  city_id: z.string().uuid("Please select a city"),
  area_id: z.string().uuid("Please select an area"),
  society_id: z.string().uuid().optional().nullable(),
  address: z.string().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

// zod v4 dropped the old `invalid_type_error`/`required_error` options in
// favor of a single `error` key.
export const step3Schema = z.object({
  price: z.number({ error: "Enter a valid price" }).positive("Price must be greater than 0"),
  is_negotiable: z.boolean().default(false),
  area_sqft: z.number().positive().optional().nullable(),
  area_marla: z.number().positive().optional().nullable(),
  beds: z.number().int().min(0).max(20).optional().nullable(),
  baths: z.number().int().min(0).max(20).optional().nullable(),
  floors: z.number().int().min(1).max(100).optional().nullable(),
  floor_number: z.number().int().min(0).max(200).optional().nullable(),
  parking_spaces: z.number().int().min(0).max(20).default(0),
  age_years: z.number().int().min(0).max(200).optional().nullable(),
  furnished_status: z.enum(["unfurnished", "semi_furnished", "furnished"]).default("unfurnished"),
  // zod v4 also stopped composing an object schema's own field-level
  // `.default()`s when the object itself is missing and falls back to its
  // outer `.default(...)` — `.default({})` here would type-error (and, at
  // runtime, produce a bare `{}` with none of the per-feature defaults
  // applied) rather than the fully-populated object it read as in v3. The
  // per-field defaults still apply correctly whenever `features` itself is
  // provided (even partially) — only the "entirely missing" fallback needs
  // spelling out in full.
  features: z
    .object({
      electricity: z.boolean().default(false),
      gas: z.boolean().default(false),
      water: z.boolean().default(false),
      security: z.boolean().default(false),
      backup_generator: z.boolean().default(false),
      swimming_pool: z.boolean().default(false),
      gym: z.boolean().default(false),
      mosque: z.boolean().default(false),
      park: z.boolean().default(false),
      cctv: z.boolean().default(false),
      internet: z.boolean().default(false),
      servant_quarters: z.boolean().default(false),
    })
    .default({
      electricity: false,
      gas: false,
      water: false,
      security: false,
      backup_generator: false,
      swimming_pool: false,
      gym: false,
      mosque: false,
      park: false,
      cctv: false,
      internet: false,
      servant_quarters: false,
    }),
});

export const step4Schema = z.object({
  // .default([]) matters here: until ImageUploader's onUploaded fires at
  // least once, `images` is `undefined`, not `[]` — without the default,
  // Zod's array type-check rejects `undefined` before .min(1) ever runs,
  // surfacing "Invalid input: expected array, received undefined" (a raw
  // internal message) instead of the friendly one below.
  images: z
    .array(
      z.object({
        thumb_url: z.string(),
        medium_url: z.string(),
        large_url: z.string(),
        og_url: z.string(),
        alt_text: z.string(),
        display_order: z.number(),
        is_primary: z.boolean(),
      }),
    )
    .min(1, "Please upload at least 1 photo")
    .default([]),
});

export const step5Schema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title too long"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  video_url: z.string().url().optional().nullable().or(z.literal("")),
});

export const step6Schema = z.object({
  meta_title: z.string().max(60).optional(),
  meta_desc: z.string().max(160).optional(),
  focus_keyword: z.string().optional(),
});

// The full create-listing payload the client submits at the end of the
// wizard (POST /api/listings) — merges all six steps so the route can
// validate the request body server-side instead of trusting the client
// form's own validation, which a direct API call could bypass entirely.
export const createListingSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema);

export type CreateListingInput = z.infer<typeof createListingSchema>;

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
