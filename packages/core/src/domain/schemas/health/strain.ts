import { z } from "zod";

import { healthVersionSchema } from "./version";

/**
 * Zod schema for `extensions.health.strain` — a read-only, source-agnostic
 * cardiovascular-load summary (e.g. WHOOP's 0–21 strain scale plus companion
 * day-level heart-rate and energy figures). Unlike the six FIT-core health
 * types it is not mandated to round-trip through FIT.
 *
 * A refinement requires `dayMaxHeartRate >= dayAverageHeartRate` when both
 * are present.
 */
export const strainSummarySchema = z
  .object({
    kind: z.literal("strain"),
    version: healthVersionSchema,
    date: z.iso.date(),
    strainScore: z.number().min(0).max(21),
    dayAverageHeartRate: z.number().int().min(0).max(300).optional(),
    dayMaxHeartRate: z.number().int().min(0).max(300).optional(),
    energyKilojoules: z.number().nonnegative().optional(),
    kaiordRecordId: z.string().uuid().optional(),
    sourceBridgeId: z.string().optional(),
    externalId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.dayAverageHeartRate !== undefined &&
      value.dayMaxHeartRate !== undefined &&
      value.dayMaxHeartRate < value.dayAverageHeartRate
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "dayMaxHeartRate must be greater than or equal to dayAverageHeartRate.",
        path: ["dayMaxHeartRate"],
      });
    }
  });

export type StrainSummary = z.infer<typeof strainSummarySchema>;
