/**
 * Calendar Enum Schemas
 *
 * Workout state and condition enums for the calendar domain.
 */

import { z } from "zod";

export const workoutStateSchema = z.enum([
  "raw",
  "structured",
  "ready",
  "pushed",
  "modified",
  "stale",
  "skipped",
]);

export type WorkoutState = z.infer<typeof workoutStateSchema>;

export const conditionSchema = z.enum([
  "rain",
  "wind",
  "heat",
  "cold",
  "fatigue",
  "injury",
  "altitude",
  "indoor",
]);

export type Condition = z.infer<typeof conditionSchema>;
