import { z } from "zod";

/**
 * Permissive extraction schema for lab-report documents. Flat and optional-
 * heavy to stay within provider structured-output complexity limits. The SPA
 * maps this result to catalog parameters and the strict `LabValue` shape;
 * nothing here is trusted as canonical.
 */
const labExtractionValueSchema = z.object({
  /** Verbatim printed label, e.g. "GPT (ALT)". Always present. */
  label: z.string(),
  /** Model-proposed canonical key; validated against the catalog downstream. */
  parameterKey: z.string().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  refLow: z.number().optional(),
  refHigh: z.number().optional(),
  /** Non-numeric printed range, e.g. "Negative" or "< 5". */
  refText: z.string().optional(),
});

export const labExtractionSchema = z.object({
  /** Report draw date if printed; ISO `YYYY-MM-DD` when determinable. */
  date: z.string().optional(),
  labName: z.string().optional(),
  fasting: z.boolean().optional(),
  drawTime: z.string().optional(),
  notes: z.string().optional(),
  values: z.array(labExtractionValueSchema),
});

export type LabExtractionValue = z.infer<typeof labExtractionValueSchema>;
export type LabExtraction = z.infer<typeof labExtractionSchema>;
