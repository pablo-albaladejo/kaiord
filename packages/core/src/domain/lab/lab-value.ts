import { z } from "zod";

import { labFlagSchema } from "./lab-flag";
import { labProvenanceSchema } from "./lab-provenance";

/** Where the effective reference range came from. */
export const labRefSourceSchema = z.enum(["report", "catalog", "none"]);
export type LabRefSource = z.infer<typeof labRefSourceSchema>;

/**
 * A single measured parameter belonging to a `LabReport`. `date` and
 * `profileId` are denormalized from the report so the per-parameter series
 * and the latest-per-parameter query are served straight from `labValues`.
 * Values and reference bounds are stored both as entered (`*Raw`) and in the
 * parameter's canonical unit (`*Canonical`) for comparable plotting.
 */
export const labValueSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  reportId: z.string().min(1),
  parameterKey: z.string().min(1),
  date: z.iso.date(),
  valueRaw: z.number(),
  unitRaw: z.string(),
  valueCanonical: z.number(),
  unitCanonical: z.string(),
  refLow: z.number().optional(),
  refHigh: z.number().optional(),
  refLowCanonical: z.number().optional(),
  refHighCanonical: z.number().optional(),
  refText: z.string().optional(),
  refSource: labRefSourceSchema,
  flag: labFlagSchema,
  provenance: labProvenanceSchema,
});

export type LabValue = z.infer<typeof labValueSchema>;
