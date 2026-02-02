import { z } from "zod";

/**
 * Zod schema for KRD session object.
 *
 * Validates training session data including timing, distance, and performance metrics.
 *
 * @example
 * ```typescript
 * import { krdSessionSchema } from '@kaiord/core';
 *
 * const session = krdSessionSchema.parse({
 *   startTime: '2025-01-15T10:30:00Z',
 *   totalElapsedTime: 3600,
 *   totalDistance: 10000,
 *   sport: 'running',
 *   avgHeartRate: 145,
 *   avgPower: 250
 * });
 * ```
 */
export const krdSessionSchema = z.object({
  startTime: z.string().datetime(),
  totalElapsedTime: z.number().min(0),
  totalTimerTime: z.number().min(0).optional(),
  totalDistance: z.number().min(0).optional(),
  sport: z.string(),
  subSport: z.string().optional(),
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  maxHeartRate: z.number().int().min(0).max(300).optional(),
  avgCadence: z.number().min(0).optional(),
  maxCadence: z.number().min(0).optional(),
  avgPower: z.number().min(0).optional(),
  maxPower: z.number().min(0).optional(),
  normalizedPower: z.number().min(0).optional(),
  trainingStressScore: z.number().min(0).optional(),
  intensityFactor: z.number().min(0).optional(),
  totalCalories: z.number().int().min(0).optional(),
  totalAscent: z.number().min(0).optional(),
  totalDescent: z.number().min(0).optional(),
  avgSpeed: z.number().min(0).optional(),
  maxSpeed: z.number().min(0).optional(),
});

/**
 * TypeScript type for KRD session, inferred from {@link krdSessionSchema}.
 *
 * Represents a complete training session with timing, distance, and performance metrics.
 */
export type KRDSession = z.infer<typeof krdSessionSchema>;
