import { z } from "zod";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for heart rate target values.
 *
 * Validates heart rate targets in BPM, zones, percent max, or ranges.
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
  z.object({ unit: z.literal(targetUnitSchema.enum.bpm), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(5),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.percent_max),
    value: z.number(),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

/**
 * TypeScript type for heart rate target value, inferred from {@link heartRateValueSchema}.
 *
 * Discriminated union representing heart rate targets in various units.
 */
export type HeartRateValue = z.infer<typeof heartRateValueSchema>;
