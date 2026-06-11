import { z } from "zod";

import { MIN_LTE_MAX_MESSAGE, minLteMax } from "./range-refinement";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for heart rate target values.
 *
 * Validates heart rate targets in BPM, zones, percent max, or ranges.
 * BPM and range bounds are capped at 300 (matching the KRD record clamp);
 * percent max is capped at 100. Range targets enforce `min <= max`.
 *
 * @example
 * ```typescript
 * import { heartRateValueSchema } from '@kaiord/core';
 *
 * // Absolute BPM
 * const bpm = heartRateValueSchema.parse({ unit: 'bpm', value: 145 });
 *
 * // Heart rate zone
 * const zone = heartRateValueSchema.parse({ unit: 'zone', value: 2 });
 * ```
 */
export const heartRateValueSchema = z.discriminatedUnion("unit", [
  z.object({
    unit: z.literal(targetUnitSchema.enum.bpm),
    value: z.number().min(0).max(300),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(5),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.percent_max),
    value: z.number().min(0).max(100),
  }),
  z
    .object({
      unit: z.literal(targetUnitSchema.enum.range),
      min: z.number().min(0).max(300),
      max: z.number().min(0).max(300),
    })
    .refine(minLteMax, { message: MIN_LTE_MAX_MESSAGE, path: ["min"] }),
]);

/**
 * TypeScript type for heart rate target value, inferred from {@link heartRateValueSchema}.
 *
 * Discriminated union representing heart rate targets in various units.
 */
export type HeartRateValue = z.infer<typeof heartRateValueSchema>;
