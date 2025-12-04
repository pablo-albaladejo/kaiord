import { z } from "zod";

/**
 * Zod schema for KRD lap object.
 *
 * Validates lap/interval data within a session.
 *
 * @example
 * ```typescript
 * import { krdLapSchema } from '@kaiord/core';
 *
 * const lap = krdLapSchema.parse({
 *   startTime: '2025-01-15T10:30:00Z',
 *   totalElapsedTime: 600,
 *   totalDistance: 1000,
 *   avgHeartRate: 142
 * });
 * ```
 */
export const krdLapSchema = z.object({
  startTime: z.string().datetime(),
  totalElapsedTime: z.number().min(0),
  totalDistance: z.number().min(0).optional(),
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  maxHeartRate: z.number().int().min(0).max(300).optional(),
  avgCadence: z.number().min(0).optional(),
  avgPower: z.number().min(0).optional(),
});

/**
 * TypeScript type for KRD lap, inferred from {@link krdLapSchema}.
 *
 * Represents a lap or interval within a session.
 */
export type KRDLap = z.infer<typeof krdLapSchema>;
