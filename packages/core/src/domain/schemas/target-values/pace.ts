import { z } from "zod";

import { rangeMember } from "./range-refinement";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for pace target values.
 *
 * Validates pace targets in meters per second, zones, or ranges.
 * Speed values are capped at 30 m/s (above any human-powered speed,
 * including downhill cycling). Range targets enforce `min <= max`.
 *
 * @example
 * ```typescript
 * import { paceValueSchema } from '@kaiord/core';
 *
 * // Absolute pace (m/s)
 * const mps = paceValueSchema.parse({ unit: 'mps', value: 3.5 });
 *
 * // Pace zone
 * const zone = paceValueSchema.parse({ unit: 'zone', value: 2 });
 * ```
 */
export const paceValueSchema = z.discriminatedUnion("unit", [
  z.object({
    unit: z.literal(targetUnitSchema.enum.mps),
    value: z.number().min(0).max(30),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(5),
  }),
  rangeMember(30),
]);

/**
 * TypeScript type for pace target value, inferred from {@link paceValueSchema}.
 *
 * Discriminated union representing pace targets in various units.
 */
export type PaceValue = z.infer<typeof paceValueSchema>;
