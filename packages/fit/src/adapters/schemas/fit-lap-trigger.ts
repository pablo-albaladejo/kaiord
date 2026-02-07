import { z } from "zod";

/**
 * FIT lap trigger types (what caused the lap to be recorded).
 */
export const fitLapTriggerSchema = z.enum([
  "manual",
  "time",
  "distance",
  "positionStart",
  "positionLap",
  "positionWaypoint",
  "positionMarked",
  "sessionEnd",
  "fitnessEquipment",
]);

export type FitLapTrigger = z.infer<typeof fitLapTriggerSchema>;
