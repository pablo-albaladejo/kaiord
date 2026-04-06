import { z } from "zod";

/**
 * Zod schema for duration type enumeration.
 *
 * Defines all possible duration types for workout steps.
 *
 * @example
 * ```typescript
 * import { durationTypeSchema } from '@kaiord/core';
 *
 * const timeType = durationTypeSchema.enum.time;
 * const distanceType = durationTypeSchema.enum.distance;
 *
 * const result = durationTypeSchema.safeParse('time');
 * ```
 */
export const durationTypeSchema = z.enum([
  "time",
  "distance",
  "heart_rate_less_than",
  "repeat_until_heart_rate_greater_than",
  "calories",
  "power_less_than",
  "power_greater_than",
  "repeat_until_time",
  "repeat_until_distance",
  "repeat_until_calories",
  "repeat_until_heart_rate_less_than",
  "repeat_until_power_less_than",
  "repeat_until_power_greater_than",
  "open",
]);

/**
 * TypeScript type for duration type, inferred from {@link durationTypeSchema}.
 *
 * String literal union of all possible duration types.
 */
export type DurationType = z.infer<typeof durationTypeSchema>;
