import { z } from "zod";
import { sportSchema } from "../sport";
import { subSportSchema } from "../sub-sport";
import { swimStrokeSchema } from "../swim-stroke";

/**
 * KRD lap trigger types - what caused the lap to be recorded.
 */
export const krdLapTriggerSchema = z.enum([
  "manual",
  "time",
  "distance",
  "position",
  "session_end",
  "fitness_equipment",
]);

export type KRDLapTrigger = z.infer<typeof krdLapTriggerSchema>;

/**
 * Zod schema for KRD lap object.
 *
 * Validates lap/interval data within a session.
 */
export const krdLapSchema = z.object({
  // Timing
  startTime: z.string().datetime(),
  totalElapsedTime: z.number().min(0),
  totalTimerTime: z.number().min(0).optional(),

  // Distance
  totalDistance: z.number().min(0).optional(),

  // Heart rate
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  maxHeartRate: z.number().int().min(0).max(300).optional(),

  // Cadence
  avgCadence: z.number().min(0).optional(),
  maxCadence: z.number().min(0).optional(),

  // Power
  avgPower: z.number().min(0).optional(),
  maxPower: z.number().min(0).optional(),
  normalizedPower: z.number().min(0).optional(),

  // Speed
  avgSpeed: z.number().min(0).optional(),
  maxSpeed: z.number().min(0).optional(),

  // Elevation
  totalAscent: z.number().min(0).optional(),
  totalDescent: z.number().min(0).optional(),

  // Calories
  totalCalories: z.number().int().min(0).optional(),

  // Classification
  trigger: krdLapTriggerSchema.optional(),
  sport: sportSchema.optional(),
  subSport: subSportSchema.optional(),

  // Workout reference
  workoutStepIndex: z.number().int().min(0).optional(),

  // Swimming
  numLengths: z.number().int().min(0).optional(),
  swimStroke: swimStrokeSchema.optional(),
});

/**
 * TypeScript type for KRD lap, inferred from {@link krdLapSchema}.
 */
export type KRDLap = z.infer<typeof krdLapSchema>;
