import { z } from "zod";

import { durationTypeSchema } from "./duration-type";

export type { DurationType } from "./duration-type";
export { durationTypeSchema } from "./duration-type";

/**
 * Zod schema for workout step duration.
 *
 * Validates duration specifications using discriminated unions based on duration type.
 * Supports time-based, distance-based, heart rate conditional, power conditional,
 * calorie-based, and open durations.
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
