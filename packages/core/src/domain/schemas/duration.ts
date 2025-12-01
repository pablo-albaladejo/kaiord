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
 * // Access enum values
 * const timeType = durationTypeSchema.enum.time;
 * const distanceType = durationTypeSchema.enum.distance;
 *
 * // Validate duration type
 * const result = durationTypeSchema.safeParse('time');
 * if (result.success) {
 *   console.log('Valid duration type:', result.data);
 * }
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
 * Zod schema for workout step duration.
 *
 * Validates duration specifications using discriminated unions based on duration type.
 * Supports time-based, distance-based, heart rate conditional, power conditional, calorie-based, and open durations.
 *
 * @example
 * ```typescript
 * import { durationSchema } from '@kaiord/core';
 *
 * // Time-based duration
 * const timeDuration = durationSchema.parse({
 *   type: 'time',
 *   seconds: 600
 * });
 *
 * // Distance-based duration
 * const distanceDuration = durationSchema.parse({
 *   type: 'distance',
 *   meters: 5000
 * });
 *
 * // Open duration (manual lap button)
 * const openDuration = durationSchema.parse({
 *   type: 'open'
 * });
 * ```
 */
export const durationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(durationTypeSchema.enum.time),
    seconds: z.number().positive(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.distance),
    meters: z.number().positive(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.heart_rate_less_than),
    bpm: z.number().int().positive(),
  }),
  z.object({
    type: z.literal(
      durationTypeSchema.enum.repeat_until_heart_rate_greater_than
    ),
    bpm: z.number().int().positive(),
    repeatFrom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.calories),
    calories: z.number().int().positive(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.power_less_than),
    watts: z.number().positive(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.power_greater_than),
    watts: z.number().positive(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.repeat_until_time),
    seconds: z.number().positive(),
    repeatFrom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.repeat_until_distance),
    meters: z.number().positive(),
    repeatFrom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.repeat_until_calories),
    calories: z.number().int().positive(),
    repeatFrom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.repeat_until_heart_rate_less_than),
    bpm: z.number().int().positive(),
    repeatFrom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.repeat_until_power_less_than),
    watts: z.number().positive(),
    repeatFrom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.repeat_until_power_greater_than),
    watts: z.number().positive(),
    repeatFrom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal(durationTypeSchema.enum.open),
  }),
]);

/**
 * TypeScript type for workout step duration, inferred from {@link durationSchema}.
 *
 * Discriminated union type representing all possible duration specifications.
 */
export type Duration = z.infer<typeof durationSchema>;

/**
 * TypeScript type for duration type, inferred from {@link durationTypeSchema}.
 *
 * String literal union of all possible duration types.
 */
export type DurationType = z.infer<typeof durationTypeSchema>;
