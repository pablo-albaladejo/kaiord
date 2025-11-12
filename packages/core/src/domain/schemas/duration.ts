import { z } from "zod";

export const durationTypeEnum = z.enum([
  "time",
  "distance",
  "heart_rate_less_than",
  "heart_rate_greater_than",
  "open",
]);

export const durationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(durationTypeEnum.enum.time),
    seconds: z.number().positive(),
  }),
  z.object({
    type: z.literal(durationTypeEnum.enum.distance),
    meters: z.number().positive(),
  }),
  z.object({
    type: z.literal(durationTypeEnum.enum.heart_rate_less_than),
    bpm: z.number().int().positive(),
  }),
  z.object({
    type: z.literal(durationTypeEnum.enum.heart_rate_greater_than),
    bpm: z.number().int().positive(),
    repeatFrom: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal(durationTypeEnum.enum.open),
  }),
]);

export type Duration = z.infer<typeof durationSchema>;
export type DurationType = z.infer<typeof durationTypeEnum>;
