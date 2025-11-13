import { z } from "zod";

export const fitDurationTypeSchema = z.enum([
  "time",
  "distance",
  "repeatUntilStepsCmplt",
  "repeatUntilHrGreaterThan",
  "hrLessThan",
  "hrGreaterThan",
  "open",
]);

export type FitDurationType = z.infer<typeof fitDurationTypeSchema>;
