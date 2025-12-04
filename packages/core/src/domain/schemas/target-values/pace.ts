import { z } from "zod";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for pace target values.
 *
 * Validates pace targets in meters per second, zones, or ranges.
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
  z.object({ unit: z.literal(targetUnitSchema.enum.mps), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(5),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

/**
 * TypeScript type for pace target value, inferred from {@link paceValueSchema}.
 *
 * Discriminated union representing pace targets in various units.
 */
export type PaceValue = z.infer<typeof paceValueSchema>;
