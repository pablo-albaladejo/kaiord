import { z } from "zod";

/**
 * FIT-side schema for `body_composition` (mesgNum 41). Garmin emits
 * this dedicated message from smart scales that report a full body
 * composition (Index S2 and equivalents). Simpler scales only emit a
 * `weight_scale` message with `percentFat`; that path is handled by
 * the weight slice instead.
 */
export const fitBodyCompositionSchema = z.object({
  timestamp: z.union([z.date(), z.string(), z.number()]),
  percentFat: z.number().optional(),
  percentHydration: z.number().optional(),
  visceralFatRating: z.number().optional(),
  boneMass: z.number().optional(),
  muscleMass: z.number().optional(),
  basalMet: z.number().optional(),
  bmi: z.number().optional(),
});

export type FitBodyComposition = z.infer<typeof fitBodyCompositionSchema>;
