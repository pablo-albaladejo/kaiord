import { z } from "zod";

/**
 * FIT-side schema for `hrv_status_summary` (mesgNum 370). The
 * @garmin/fitsdk Decoder applies the scale=128 conversion for ms
 * fields automatically.
 */
export const fitHrvStatusSummarySchema = z.object({
  timestamp: z.union([z.date(), z.string(), z.number()]),
  weeklyAverage: z.number().optional(),
  lastNightAverage: z.number().optional(),
  lastNight5MinHigh: z.number().optional(),
  baselineLowUpper: z.number().optional(),
  baselineBalancedLower: z.number().optional(),
  baselineBalancedUpper: z.number().optional(),
  status: z.enum(["none", "poor", "low", "unbalanced", "balanced"]).optional(),
});

/**
 * FIT-side schema for `hrv_value` (mesgNum 371) — a single 5-min
 * RMSSD sample. KRD's `extensions.health.hrv` is a SUMMARY, not a
 * time-series; per-sample data is not currently preserved in KRD.
 */
export const fitHrvValueSchema = z.object({
  timestamp: z.union([z.date(), z.string(), z.number()]),
  value: z.number(),
});

export type FitHrvStatusSummary = z.infer<typeof fitHrvStatusSummarySchema>;
export type FitHrvValue = z.infer<typeof fitHrvValueSchema>;
