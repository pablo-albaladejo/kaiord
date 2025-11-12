import { z } from "zod";

export const durationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("time"),
    seconds: z.number().positive(),
  }),
  z.object({
    type: z.literal("distance"),
    meters: z.number().positive(),
  }),
  z.object({
    type: z.literal("open"),
  }),
]);

export type Duration = z.infer<typeof durationSchema>;
