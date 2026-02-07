import { z } from "zod";

export const tcxDurationTypeSchema = z.enum([
  "Time",
  "Distance",
  "LapButton",
  "HeartRateAbove",
  "HeartRateBelow",
  "CaloriesBurned",
]);

export type TcxDurationType = z.infer<typeof tcxDurationTypeSchema>;
