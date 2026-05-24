import { z } from "zod";

/**
 * FIT-side schema for a single `weight_scale` message (mesgNum 30).
 *
 * Garmin encodes weight as uint16 with scale 100 (raw 7580 = 75.80 kg).
 * The @garmin/fitsdk Decoder leaves the raw value un-scaled for the
 * special `weight` field type — the field-level mapper divides by 100.
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
