import { z } from "zod";
import {
  cadenceValueSchema,
  heartRateValueSchema,
  paceValueSchema,
  powerValueSchema,
  strokeTypeValueSchema,
} from "./target-values";

/**
 * Zod schema for target type enumeration.
 *
 * Defines all possible target types for workout steps.
 *
 * @example
 * ```typescript
 * import { targetTypeSchema } from '@kaiord/core';
 *
 * // Access enum values
 * const powerType = targetTypeSchema.enum.power;
 * const hrType = targetTypeSchema.enum.heart_rate;
 *
 * // Validate target type
 * const result = targetTypeSchema.safeParse('power');
 * ```
 */
export const targetTypeSchema = z.enum([
  "power",
  "heart_rate",
  "cadence",
  "pace",
  "stroke_type",
  "open",
]);

/**
 * Zod schema for workout step target.
 *
 * Validates target specifications using discriminated unions based on target type.
 * Supports power, heart rate, cadence, pace, stroke type, and open targets.
 *
 * @example
 * ```typescript
 * import { targetSchema } from '@kaiord/core';
 *
 * // Power target in watts
 * const powerTarget = targetSchema.parse({
 *   type: 'power',
 *   value: { unit: 'watts', value: 250 }
 * });
 *
 * // Heart rate target in zone
 * const hrTarget = targetSchema.parse({
 *   type: 'heart_rate',
 *   value: { unit: 'zone', value: 2 }
 * });
 *
 * // Open target (no specific target)
 * const openTarget = targetSchema.parse({
 *   type: 'open'
 * });
 * ```
 */
export const targetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(targetTypeSchema.enum.power),
    value: powerValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeSchema.enum.heart_rate),
    value: heartRateValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeSchema.enum.cadence),
    value: cadenceValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeSchema.enum.pace),
    value: paceValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeSchema.enum.stroke_type),
    value: strokeTypeValueSchema,
  }),
  z.object({ type: z.literal(targetTypeSchema.enum.open) }),
]);

/**
 * TypeScript type for workout step target, inferred from {@link targetSchema}.
 *
 * Discriminated union type representing all possible target specifications.
 */
export type Target = z.infer<typeof targetSchema>;

/**
 * TypeScript type for target type, inferred from {@link targetTypeSchema}.
 *
 * String literal union of all possible target types.
 */
export type TargetType = z.infer<typeof targetTypeSchema>;

export { targetUnitSchema } from "./target-values";
export type {
  CadenceValue,
  HeartRateValue,
  PaceValue,
  PowerValue,
  StrokeTypeValue,
  TargetUnit,
} from "./target-values";
