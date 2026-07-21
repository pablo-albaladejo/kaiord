import { z } from "zod";

/**
 * FIT-side schema for a single `weight_scale` message (mesgNum 30).
 *
 * Garmin encodes weight as uint16 with profile scale 100, but the
 * @garmin/fitsdk Decoder auto-applies that scale, so the decoded value
 * is already REAL kilograms (a real fixture decodes `weight: 75.8`).
 * The field-level mapper carries it through unscaled.
 */
export const fitWeightScaleSchema = z.object({
  timestamp: z.union([z.date(), z.string(), z.number()]),
  weight: z.number(),
  percentFat: z.number().optional(),
  percentHydration: z.number().optional(),
  visceralFatMass: z.number().optional(),
  boneMass: z.number().optional(),
  muscleMass: z.number().optional(),
  bmi: z.number().optional(),
  userProfileIndex: z.number().int().optional(),
});

export type FitWeightScale = z.infer<typeof fitWeightScaleSchema>;
