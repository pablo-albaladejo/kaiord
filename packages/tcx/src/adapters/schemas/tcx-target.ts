import { z } from "zod";

export const tcxTargetTypeSchema = z.enum([
  "HeartRate",
  "Speed",
  "Cadence",
  "None",
]);
