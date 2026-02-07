import { z } from "zod";

/**
 * FIT RECORD message schema (Message ID: 20).
 *
 * Contains time-series data points (typically 1 per second).
 * Coordinates are in semicircles (signed 32-bit integer).
 */
export const fitRecordSchema = z.object({
  timestamp: z.number(),
  positionLat: z.number().optional(),
  positionLong: z.number().optional(),
  altitude: z.number().optional(),
  enhancedAltitude: z.number().optional(),
  speed: z.number().optional(),
  enhancedSpeed: z.number().optional(),
  distance: z.number().optional(),
  heartRate: z.number().optional(),
  cadence: z.number().optional(),
  fractionalCadence: z.number().optional(),
  power: z.number().optional(),
  temperature: z.number().optional(),
  verticalOscillation: z.number().optional(),
  stanceTime: z.number().optional(),
  stanceTimePercent: z.number().optional(),
  stepLength: z.number().optional(),
  compressedTimestamp: z.number().optional(),
});

export type FitRecord = z.infer<typeof fitRecordSchema>;
