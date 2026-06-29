import { z } from "zod";

export const fitTargetTypeSchema = z.enum([
  "power",
  "heartRate",
  "cadence",
  "speed",
  "swimStroke",
  "open",
]);
