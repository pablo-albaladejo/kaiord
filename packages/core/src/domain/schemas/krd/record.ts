import { z } from "zod";

/**
 * Zod schema for KRD record object.
 *
 * Validates time-series data points (typically 1Hz or higher).
 *
 * @example
 * ```typescript
 * import { krdRecordSchema } from '@kaiord/core';
 *
 * const record = krdRecordSchema.parse({
 *   timestamp: '2025-01-15T10:30:00Z',
 *   position: { lat: 41.3851, lon: 2.1734 },
 *   altitude: 12.5,
 *   heartRate: 145,
 *   power: 250
 * });
 * ```
 */
export const krdRecordSchema = z.object({
  timestamp: z.string().datetime(),
  position: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    })
    .optional(),
  altitude: z.number().optional(),
  heartRate: z.number().int().min(0).max(300).optional(),
  cadence: z.number().min(0).optional(),
  power: z.number().min(0).optional(),
  speed: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
});

/**
 * TypeScript type for KRD record, inferred from {@link krdRecordSchema}.
 *
 * Represents a time-series data point with GPS, heart rate, power, and other metrics.
 */
export type KRDRecord = z.infer<typeof krdRecordSchema>;
