import { z } from "zod";

import { labProvenanceSchema } from "./lab-provenance";

/**
 * A lab report — one dated analysis (draw) that groups N `LabValue`
 * measurements. Flat shape (direct fields, no `krd` wrapper) following the
 * `activity` principle of an own shape over generic infrastructure. Context
 * fields (fasting / drawTime / notes) are optional per-report annotations.
 */
export const labReportSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  /** YYYY-MM-DD local calendar date of the blood draw. */
  date: z.iso.date(),
  labName: z.string().optional(),
  fasting: z.boolean().optional(),
  drawTime: z.string().optional(),
  notes: z.string().optional(),
  provenance: labProvenanceSchema,
});

export type LabReport = z.infer<typeof labReportSchema>;
