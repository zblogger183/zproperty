import { z } from "zod";
import { step1Schema, step2Schema, step3Schema, step5Schema } from "@/app/dashboard/listings/schemas";

// The edit form is a single page, not a wizard, so it validates all of
// steps 1/2/3/5 at once. Step 4 (images) and step 6 (SEO meta) are
// deliberately excluded — photos go through their own dedicated actions
// (deleteListingImageAction, ImageUploader's own upload route) and SEO
// fields aren't part of the edit form's scope, so omitting them here means
// updateListingAction/resubmitFromEditAction never touch those columns.
export const editListingSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step5Schema);

export type EditListingInput = z.infer<typeof editListingSchema>;
