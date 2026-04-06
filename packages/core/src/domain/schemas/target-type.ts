import { z } from "zod";

/**
 * Zod schema for target type enumeration.
 *
 * Defines all possible target types for workout steps.
 *
 * @example
 * ```typescript
 * import { targetTypeSchema } from '@kaiord/core';
 *
 * const powerType = targetTypeSchema.enum.power;
 * const hrType = targetTypeSchema.enum.heart_rate;
 *
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
 * TypeScript type for target type, inferred from {@link targetTypeSchema}.
 *
 * String literal union of all possible target types.
 */
export type TargetType = z.infer<typeof targetTypeSchema>;
