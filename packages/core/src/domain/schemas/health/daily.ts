import { z } from "zod";

import { healthVersionSchema } from "./version";

/**
 * Zod schema for `extensions.health.daily` — a day-scoped wellness
 * summary covering steps, calories, and intensity minutes.
 *
 * Garmin FIT `file_type` values `monitoringA (15)`, `monitoringDaily (28)`,
 * and `monitoringB (32)` all map to this single sub-schema; consumers
 * that need to discriminate the source can do so via a future additive
 * field in a v2.x minor version.
 */
export const dailyWellnessSchema = z.object({
  kind: z.literal("daily"),
  version: healthVersionSchema,
  date: z.iso.date(),
  steps: z.number().int().nonnegative(),
  activeCalories: z.number().int().nonnegative(),
  restingCalories: z.number().int().nonnegative(),
  intensityMinutes: z.object({
    moderate: z.number().int().nonnegative(),
    vigorous: z.number().int().nonnegative(),
  }),
  floorsClimbed: z.number().int().nonnegative().optional(),
  kaiordRecordId: z.string().uuid().optional(),
  sourceBridgeId: z.string().optional(),
  externalId: z.string().optional(),
});

export type DailyWellness = z.infer<typeof dailyWellnessSchema>;
