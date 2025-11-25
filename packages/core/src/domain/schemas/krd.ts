import { z } from "zod";

/**
 * Zod schema for KRD metadata object.
 *
 * Validates file-level metadata including creation timestamp, device information, and sport type.
 *
 * @example
 * ```typescript
 * import { krdMetadataSchema } from '@kaiord/core';
 *
 * // Validate metadata
 * const result = krdMetadataSchema.safeParse({
 *   created: '2025-01-15T10:30:00Z',
 *   manufacturer: 'garmin',
 *   product: 'fenix7',
 *   sport: 'running',
 *   subSport: 'trail'
 * });
 *
 * if (result.success) {
 *   console.log('Valid metadata:', result.data);
 * }
 * ```
 */
export const krdMetadataSchema = z.object({
  created: z.string().datetime(),
  manufacturer: z.string().optional(),
  product: z.string().optional(),
  serialNumber: z.string().optional(),
  sport: z.string(),
  subSport: z.string().optional(),
});

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
  avgPower: z.number().min(0).optional(),
  totalCalories: z.number().int().min(0).optional(),
});

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
 * Zod schema for KRD event object.
 *
 * Validates workout events (start, stop, pause, lap, etc.).
 *
 * @example
 * ```typescript
 * import { krdEventSchema } from '@kaiord/core';
 *
 * const event = krdEventSchema.parse({
 *   timestamp: '2025-01-15T10:30:00Z',
 *   eventType: 'lap',
 *   data: 1
 * });
 * ```
 */
export const krdEventSchema = z.object({
  timestamp: z.string().datetime(),
  eventType: z.enum([
    "start",
    "stop",
    "pause",
    "resume",
    "lap",
    "marker",
    "timer",
  ]),
  eventGroup: z.number().int().optional(),
  data: z.number().int().optional(),
});

/**
 * Zod schema for the complete KRD (Kaiord Representation Definition) format.
 *
 * KRD is a JSON-based canonical format for workout and activity data.
 * MIME type: `application/vnd.kaiord+json`
 *
 * @example
 * ```typescript
 * import { krdSchema } from '@kaiord/core';
 *
 * // Parse and validate KRD data
 * const krd = krdSchema.parse({
 *   version: '1.0',
 *   type: 'workout',
 *   metadata: {
 *     created: '2025-01-15T10:30:00Z',
 *     sport: 'running'
 *   },
 *   sessions: [{
 *     startTime: '2025-01-15T10:30:00Z',
 *     totalElapsedTime: 3600,
 *     totalDistance: 10000,
 *     sport: 'running'
 *   }]
 * });
 *
 * // Safe parsing with error handling
 * const result = krdSchema.safeParse(data);
 * if (!result.success) {
 *   console.error('Validation errors:', result.error.issues);
 * }
 * ```
 */
export const krdSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/),
  type: z.enum(["workout", "activity", "course"]),
  metadata: krdMetadataSchema,
  sessions: z.array(krdSessionSchema).optional(),
  laps: z.array(krdLapSchema).optional(),
  records: z.array(krdRecordSchema).optional(),
  events: z.array(krdEventSchema).optional(),
  extensions: z.record(z.unknown()).optional(),
});

/**
 * TypeScript type for KRD metadata, inferred from {@link krdMetadataSchema}.
 *
 * Contains file-level metadata including creation timestamp, device information, and sport type.
 */
export type KRDMetadata = z.infer<typeof krdMetadataSchema>;

/**
 * TypeScript type for KRD session, inferred from {@link krdSessionSchema}.
 *
 * Represents a complete training session with timing, distance, and performance metrics.
 */
export type KRDSession = z.infer<typeof krdSessionSchema>;

/**
 * TypeScript type for KRD lap, inferred from {@link krdLapSchema}.
 *
 * Represents a lap or interval within a session.
 */
export type KRDLap = z.infer<typeof krdLapSchema>;

/**
 * TypeScript type for KRD record, inferred from {@link krdRecordSchema}.
 *
 * Represents a time-series data point with GPS, heart rate, power, and other metrics.
 */
export type KRDRecord = z.infer<typeof krdRecordSchema>;

/**
 * TypeScript type for KRD event, inferred from {@link krdEventSchema}.
 *
 * Represents a workout event (start, stop, pause, lap, etc.).
 */
export type KRDEvent = z.infer<typeof krdEventSchema>;

/**
 * TypeScript type for the complete KRD format, inferred from {@link krdSchema}.
 *
 * KRD (Kaiord Representation Definition) is the canonical JSON format for workout and activity data.
 */
export type KRD = z.infer<typeof krdSchema>;
