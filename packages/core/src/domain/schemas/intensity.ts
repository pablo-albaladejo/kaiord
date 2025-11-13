import { z } from "zod";

export const intensitySchema = z.enum([
  "warmup",
  "active",
  "cooldown",
  "rest",
  "recovery",
  "interval",
  "other",
]);

export type Intensity = z.infer<typeof intensitySchema>;
