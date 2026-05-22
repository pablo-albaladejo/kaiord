import { z } from "zod";

/**
 * FIT-side schema for `monitoring_info` (mesgNum 103) — the per-file
 * monitoring header that carries day-level metadata.
 */
export const fitMonitoringInfoSchema = z.object({
  timestamp: z.union([z.date(), z.string(), z.number()]),
  restingMetabolicRate: z.number().optional(),
});

/**
 * FIT-side schema for `monitoring` (mesgNum 55). Garmin emits many of
 * these per day; most are sparse (just timestamp + heart rate or
 * activity-type counters), and one carries the day summary with
 * `steps`, `activeCalories`, and `durationMin: 1440`.
 */
export const fitMonitoringSchema = z.object({
  timestamp: z.union([z.date(), z.string(), z.number()]).optional(),
  steps: z.number().int().nonnegative().optional(),
  activeCalories: z.number().int().nonnegative().optional(),
  durationMin: z.number().int().nonnegative().optional(),
  cycles: z.number().nonnegative().optional(),
  distance: z.number().nonnegative().optional(),
  activeTime: z.number().int().nonnegative().optional(),
  activityType: z.string().optional(),
});

export type FitMonitoringInfo = z.infer<typeof fitMonitoringInfoSchema>;
export type FitMonitoring = z.infer<typeof fitMonitoringSchema>;
