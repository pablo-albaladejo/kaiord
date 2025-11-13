import { z } from "zod";

export const fitTargetTypeEnum = z.enum([
  "power",
  "heartRate",
  "cadence",
  "speed",
  "swimStroke",
  "open",
]);

export type FitTargetType = z.infer<typeof fitTargetTypeEnum>;
