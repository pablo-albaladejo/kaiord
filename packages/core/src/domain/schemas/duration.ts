import { z } from "zod";

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
    type: z.literal(durationTypeSchema.enum.repeat_until_heart_rate_greater_than),
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

export type Duration = z.infer<typeof durationSchema>;
export type DurationType = z.infer<typeof durationTypeSchema>;
