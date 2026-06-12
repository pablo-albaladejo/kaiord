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
  startTime: z.iso.datetime(),
  /** seconds */
  totalElapsedTime: z.number().min(0),
  /** seconds */
  totalTimerTime: z.number().min(0).optional(),
  /** meters */
  totalDistance: z.number().min(0).optional(),
  /** @see sportSchema for known sport values. Accepts custom strings for forward compatibility. */
  sport: z.string(),
  subSport: z.string().optional(),
  /** bpm */
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  /** bpm */
  maxHeartRate: z.number().int().min(0).max(300).optional(),
  /** rpm */
  avgCadence: z.number().min(0).optional(),
  /** rpm */
  maxCadence: z.number().min(0).optional(),
  /** watts */
  avgPower: z.number().min(0).optional(),
  /** watts */
  maxPower: z.number().min(0).optional(),
  /** watts */
  normalizedPower: z.number().min(0).optional(),
  /** TSS — unitless training-load score */
  trainingStressScore: z.number().min(0).optional(),
  /** IF — unitless ratio of normalized power to FTP */
  intensityFactor: z.number().min(0).optional(),
  /** kcal */
  totalCalories: z.number().int().min(0).optional(),
  /** meters */
  totalAscent: z.number().min(0).optional(),
  /** meters */
  totalDescent: z.number().min(0).optional(),
  /** m/s */
  avgSpeed: z.number().min(0).optional(),
  /** m/s */
  maxSpeed: z.number().min(0).optional(),
});

/**
 * TypeScript type for KRD session, inferred from {@link krdSessionSchema}.
 *
 * Represents a complete training session with timing, distance, and performance metrics.
 */
export type KRDSession = z.infer<typeof krdSessionSchema>;
