import { z } from "zod";

/**
 * Zod schema for `extensions.health.hrv` — a heart-rate-variability
 * summary captured either overnight (Garmin Body Battery / HRV Status)
 * or as a spot measurement.
 */
export const hrvSummarySchema = z.object({
  kind: z.literal("hrv"),
  version: z.string().regex(/^2\.\d+$/),
  measuredAt: z.iso.datetime(),
  rMSSD: z.number().positive(),
  measurementWindow: z.enum(["overnight", "spot"]),
  score: z.number().int().min(0).max(100).optional(),
});

export type HrvSummary = z.infer<typeof hrvSummarySchema>;
