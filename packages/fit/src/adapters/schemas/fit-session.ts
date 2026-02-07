import { z } from "zod";
import { fitSportSchema } from "./fit-sport";
import { fitSubSportSchema } from "./fit-sub-sport";

/**
 * FIT SESSION message schema (Message ID: 18).
 *
 * Contains aggregate statistics for the entire workout/activity.
 */
export const fitSessionSchema = z.object({
  timestamp: z.number(),
  startTime: z.number(),
  totalElapsedTime: z.number(),
  totalTimerTime: z.number(),
  totalDistance: z.number().optional(),
  totalCalories: z.number().optional(),
  avgSpeed: z.number().optional(),
  maxSpeed: z.number().optional(),
  enhancedAvgSpeed: z.number().optional(),
  enhancedMaxSpeed: z.number().optional(),
  avgHeartRate: z.number().optional(),
  maxHeartRate: z.number().optional(),
  avgCadence: z.number().optional(),
  maxCadence: z.number().optional(),
  avgPower: z.number().optional(),
  maxPower: z.number().optional(),
  normalizedPower: z.number().optional(),
  trainingStressScore: z.number().optional(),
  intensityFactor: z.number().optional(),
  totalAscent: z.number().optional(),
  totalDescent: z.number().optional(),
  sport: fitSportSchema,
  subSport: fitSubSportSchema.optional(),
  numLaps: z.number().optional(),
  firstLapIndex: z.number().optional(),
});

export type FitSession = z.infer<typeof fitSessionSchema>;
