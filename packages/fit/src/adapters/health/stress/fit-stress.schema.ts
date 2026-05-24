import { z } from "zod";

/**
 * FIT-side schema for `stress_level` (mesgNum 227) — a single
 * device-side stress sample. Garmin uses sint16 so it can emit
 * negative sentinels for invalid/not-detected; only values in [0, 100]
 * are valid stress readings.
 */
export const fitStressLevelSchema = z.object({
  stressLevelTime: z.union([z.date(), z.string(), z.number()]),
  stressLevelValue: z.number().int(),
});

export type FitStressLevel = z.infer<typeof fitStressLevelSchema>;
