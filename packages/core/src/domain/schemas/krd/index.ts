import { z } from "zod";
import { krdEventSchema } from "./event";
import { krdLapSchema } from "./lap";
import { krdMetadataSchema } from "./metadata";
import { krdRecordSchema } from "./record";
import { krdSessionSchema } from "./session";

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
 * TypeScript type for the complete KRD format, inferred from {@link krdSchema}.
 *
 * KRD (Kaiord Representation Definition) is the canonical JSON format for workout and activity data.
 */
export type KRD = z.infer<typeof krdSchema>;

export { krdEventSchema, type KRDEvent } from "./event";
export {
  krdLapSchema,
  krdLapTriggerSchema,
  type KRDLap,
  type KRDLapTrigger,
} from "./lap";
export { krdMetadataSchema, type KRDMetadata } from "./metadata";
export { krdRecordSchema, type KRDRecord } from "./record";
export { krdSessionSchema, type KRDSession } from "./session";
