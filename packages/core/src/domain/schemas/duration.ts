import { z } from "zod";

export const durationTypeEnum = z.enum(["time", "distance", "open"]);

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
    type: z.literal(durationTypeEnum.enum.open),
  }),
]);

export type Duration = z.infer<typeof durationSchema>;
export type DurationType = z.infer<typeof durationTypeEnum>;
