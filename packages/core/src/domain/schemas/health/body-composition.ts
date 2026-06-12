import { z } from "zod";

import { healthVersionSchema } from "./version";

/**
 * Zod schema for `extensions.health.bodyComposition` — a body-composition
 * snapshot captured at a point in time.
 *
 * Each metric field is optional because devices vary in what they report
 * (a basic scale may emit only `bodyFatPercent`, a Garmin Index scale
 * emits the full set). A refinement requires that at least one metric
 * field be present so empty payloads are rejected.
 */
export const bodyCompositionSchema = z
  .object({
    kind: z.literal("bodyComposition"),
    version: healthVersionSchema,
    measuredAt: z.iso.datetime(),
    bodyFatPercent: z.number().min(0).max(100).optional(),
    leanMassKilograms: z.number().positive().optional(),
    boneMassKilograms: z.number().positive().optional(),
    bodyWaterPercent: z.number().min(0).max(100).optional(),
    bmi: z.number().positive().optional(),
    kaiordRecordId: z.string().uuid().optional(),
    sourceBridgeId: z.string().optional(),
    externalId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const hasAny =
      value.bodyFatPercent !== undefined ||
      value.leanMassKilograms !== undefined ||
      value.boneMassKilograms !== undefined ||
      value.bodyWaterPercent !== undefined ||
      value.bmi !== undefined;
    if (!hasAny) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one body-composition field (bodyFatPercent, leanMassKilograms, boneMassKilograms, bodyWaterPercent, bmi) must be present.",
      });
    }
  });

export type BodyComposition = z.infer<typeof bodyCompositionSchema>;
