import { z } from "zod";

/** Reference-range bounds expressed in a parameter's canonical unit. */
export const labRefRangeSchema = z.object({
  low: z.number().optional(),
  high: z.number().optional(),
});
export type LabRefRange = z.infer<typeof labRefRangeSchema>;

/** A unit convertible to the canonical unit by an affine transform. */
export const knownUnitSchema = z.object({
  unit: z.string(),
  factorToCanonical: z.number(),
  offsetToCanonical: z.number().optional(),
});
export type KnownUnit = z.infer<typeof knownUnitSchema>;

/** Panel/group a core parameter belongs to. */
export const labPanelSchema = z.enum([
  "hemogram",
  "biochemistry",
  "lipids",
  "hepatic",
  "ions",
  "iron",
  "thyroid",
  "vitamins",
  "hormones",
  "sports",
]);
export type LabPanel = z.infer<typeof labPanelSchema>;

/** Static reference-data descriptor for a core lab parameter. */
export const labParameterSchema = z.object({
  key: z.string(),
  nameES: z.string(),
  abbrev: z.string(),
  canonicalUnit: z.string(),
  knownUnits: z.array(knownUnitSchema).optional(),
  canonicalRefLow: z.number().optional(),
  canonicalRefHigh: z.number().optional(),
  refBySex: z
    .object({ male: labRefRangeSchema, female: labRefRangeSchema })
    .optional(),
  panel: labPanelSchema,
  loinc: z.string().optional(),
});
export type LabParameter = z.infer<typeof labParameterSchema>;
