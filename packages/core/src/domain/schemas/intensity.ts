import { z } from "zod";

export const intensityEnum = z.enum([
  "warmup",
  "active",
  "cooldown",
  "rest",
  "recovery",
  "interval",
  "other",
]);

export type Intensity = z.infer<typeof intensityEnum>;
