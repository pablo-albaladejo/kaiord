import { z } from "zod";
import { fitLapTriggerSchema } from "./fit-lap-trigger";
import { fitSportSchema } from "./fit-sport";
import { fitSubSportSchema } from "./fit-sub-sport";

/**
 * FIT LAP message schema (Message ID: 19).
 *
 * Contains per-lap/interval statistics for structured workouts.
 */
export const fitLapSchema = z.object({
  // Identifiers
  messageIndex: z.number().optional(),
  timestamp: z.number(),

  // Timing
  startTime: z.number(),
  totalElapsedTime: z.number(),
  totalTimerTime: z.number(),

  // Distance
  totalDistance: z.number().optional(),

  // Speed (enhanced values preferred when available)
  avgSpeed: z.number().optional(),
  maxSpeed: z.number().optional(),
  enhancedAvgSpeed: z.number().optional(),
  enhancedMaxSpeed: z.number().optional(),

  // Heart rate
  avgHeartRate: z.number().optional(),
  maxHeartRate: z.number().optional(),

  // Cadence
  avgCadence: z.number().optional(),
  maxCadence: z.number().optional(),

  // Power
  avgPower: z.number().optional(),
  maxPower: z.number().optional(),
  normalizedPower: z.number().optional(),

  // Elevation
  totalAscent: z.number().optional(),
  totalDescent: z.number().optional(),

  // Calories
  totalCalories: z.number().optional(),

  // Classification
  lapTrigger: fitLapTriggerSchema.optional(),
  sport: fitSportSchema.optional(),
  subSport: fitSubSportSchema.optional(),

  // Swimming
  numLengths: z.number().optional(),
  swimStroke: z.number().optional(),

  // Workout reference
  wktStepIndex: z.number().optional(),
});

export type FitLap = z.infer<typeof fitLapSchema>;
