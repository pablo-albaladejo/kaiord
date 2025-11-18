import { z } from "zod";

export const zwiftIntervalTypeSchema = z.enum([
  "SteadyState",
  "Warmup",
  "Ramp",
  "Cooldown",
  "IntervalsT",
  "FreeRide",
]);

export type ZwiftIntervalType = z.infer<typeof zwiftIntervalTypeSchema>;
