import { z } from "zod";

export const fitDurationTypeEnum = z.enum([
  "time",
  "distance",
  "repeatUntilStepsCmplt",
  "repeatUntilHrGreaterThan",
  "hrLessThan",
  "hrGreaterThan",
  "open",
]);

export type FitDurationType = z.infer<typeof fitDurationTypeEnum>;
