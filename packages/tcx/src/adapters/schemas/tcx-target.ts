import { z } from "zod";

export const tcxTargetTypeSchema = z.enum([
  "HeartRate",
  "Speed",
  "Cadence",
  "None",
]);

export type TcxTargetType = z.infer<typeof tcxTargetTypeSchema>;
