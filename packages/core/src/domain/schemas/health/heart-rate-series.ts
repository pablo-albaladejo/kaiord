import { z } from "zod";

import { healthVersionSchema } from "./version";

/**
 * Zod schema for `extensions.health.heart-rate-series` — a read-only,
 * source-agnostic, compact uniform-interval daily heart-rate trace. Unlike
 * the six FIT-core health types it is not mandated to round-trip through
 * FIT, and unlike a recorded activity it is not tied to a workout session.
 *
 * `samples` is a fixed-cadence array of per-slot heart-rate readings
 * starting at `startTime`, spaced `intervalSeconds` apart; `null` marks a
 * missing slot (a sensor gap). A refinement requires at least one non-null
 * sample — an all-gap series carries no information and is rejected.
 */
export const heartRateSeriesSchema = z
  .object({
    kind: z.literal("heart-rate-series"),
    version: healthVersionSchema,
    startTime: z.iso.datetime(),
    intervalSeconds: z.number().int().positive(),
    samples: z.array(z.number().int().min(0).max(300).nullable()).min(1),
    kaiordRecordId: z.string().uuid().optional(),
    sourceBridgeId: z.string().optional(),
    externalId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const hasNonNullSample = value.samples.some((sample) => sample !== null);
    if (!hasNonNullSample) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one non-null sample is required; an all-gap series is not meaningful.",
        path: ["samples"],
      });
    }
  });

export type HeartRateSeries = z.infer<typeof heartRateSeriesSchema>;
