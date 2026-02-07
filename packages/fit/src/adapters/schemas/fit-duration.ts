import { z } from "zod";

export const fitDurationTypeSchema = z.enum([
  "time",
  "distance",
  "repeatUntilStepsCmplt",
  "repeatUntilHrGreaterThan",
  "hrLessThan",
  "hrGreaterThan",
  "calories",
  "powerLessThan",
  "powerGreaterThan",
  "repeatUntilTime",
  "repeatUntilDistance",
  "repeatUntilCalories",
  "repeatUntilHrLessThan",
  "repeatUntilPowerLessThan",
  "repeatUntilPowerGreaterThan",
  "open",
]);

export type FitDurationType = z.infer<typeof fitDurationTypeSchema>;
