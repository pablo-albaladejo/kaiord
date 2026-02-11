import { z } from "zod";
import { krdEventSchema } from "./event";
import { krdLapSchema } from "./lap";
import { krdMetadataSchema } from "./metadata";
import { krdRecordSchema } from "./record";
import { krdSessionSchema } from "./session";

/**
 * Zod schema for the complete KRD (Kaiord Representation Definition) format.
 *
 * KRD is a JSON-based canonical format for structured workout, recorded
 * activity, and course data. Each KRD document has an explicit `type` field
 * that determines its purpose:
 *
 * - `"structured_workout"` - Planned training with steps and targets
 * - `"recorded_activity"` - Completed training with GPS/sensor data
 * - `"course"` - Navigation route with waypoints
 *
 * MIME type: `application/vnd.kaiord+json`
 *
 * @example
 * ```typescript
 * import { krdSchema } from '@kaiord/core';
 *
 * const krd = krdSchema.parse({
 *   version: '1.0',
 *   type: 'structured_workout',
 *   metadata: {
 *     created: '2025-01-15T10:30:00Z',
 *     sport: 'cycling'
 *   },
 *   extensions: {
 *     structured_workout: { name: 'FTP Test', sport: 'cycling', steps: [] }
 *   }
 * });
 * ```
 */
export const krdSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/),
  type: z.enum(["structured_workout", "recorded_activity", "course"]),
  metadata: krdMetadataSchema,
  sessions: z.array(krdSessionSchema).optional(),
  laps: z.array(krdLapSchema).optional(),
  records: z.array(krdRecordSchema).optional(),
  events: z.array(krdEventSchema).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
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
