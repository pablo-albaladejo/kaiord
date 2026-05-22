import { z } from "zod";

import {
  fileTypeSchema,
  healthFileTypes,
  workoutLikeFileTypes,
} from "../file-type";
import {
  bodyCompositionSchema,
  dailyWellnessSchema,
  hrvSummarySchema,
  sleepRecordSchema,
  stressEpisodeSchema,
  weightMeasurementSchema,
} from "../health";
import { krdEventSchema } from "./event";
import { krdLapSchema } from "./lap";
import { krdMetadataSchema } from "./metadata";
import { krdRecordSchema } from "./record";
import { krdSessionSchema } from "./session";

const workoutLikeTypes = workoutLikeFileTypes as readonly string[];
const healthTypes = healthFileTypes as readonly string[];

/**
 * Tagged shape for KRD `extensions`.
 *
 * Reserved namespaces are validated when present:
 * - `structured_workout`, `fit`, `course`, `course_points` carry adapter-
 *   specific payloads whose shape is narrowed by downstream consumers
 *   (e.g. the SPA editor's `ui-workout` view).
 * - `health.<metric>` payloads are validated against the `health-data`
 *   capability sub-schemas.
 *
 * `catchall(z.unknown())` keeps unknown adapter-defined namespaces
 * round-trippable per the extension preservation rule in
 * `openspec/specs/krd-format`.
 */
export const krdExtensionsSchema = z
  .object({
    structured_workout: z.unknown().optional(),
    fit: z.unknown().optional(),
    course: z.unknown().optional(),
    course_points: z.unknown().optional(),
    health: z
      .object({
        sleep: sleepRecordSchema.optional(),
        weight: weightMeasurementSchema.optional(),
        hrv: hrvSummarySchema.optional(),
        daily: dailyWellnessSchema.optional(),
        bodyComposition: bodyCompositionSchema.optional(),
        stress: stressEpisodeSchema.optional(),
      })
      .catchall(z.unknown())
      .optional(),
  })
  .catchall(z.unknown());

export type KRDExtensions = z.infer<typeof krdExtensionsSchema>;

/**
 * Zod schema for the complete KRD (Kaiord Representation Definition) format.
 *
 * KRD is a JSON-based canonical format for structured workout, recorded
 * activity, course, and (as of v2.0) health-domain data. The `type` field
 * is the top-level discriminator and gates the conditional `metadata.sport`
 * invariant:
 *
 * - For `structured_workout`, `recorded_activity`, `course` —
 *   `metadata.sport` MUST be a non-empty string (preserved from v1.x).
 * - For the six health types — `metadata.sport` MUST be absent or empty.
 *
 * MIME type: `application/vnd.kaiord+json`
 *
 * @example
 * ```typescript
 * import { krdSchema } from '@kaiord/core';
 *
 * const krd = krdSchema.parse({
 *   version: '2.0',
 *   type: 'sleep_record',
 *   metadata: { created: '2026-05-22T07:00:00Z' },
 *   extensions: {
 *     health: {
 *       sleep: { ... }
 *     }
 *   }
 * });
 * ```
 */
export const krdSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+$/),
    type: fileTypeSchema,
    metadata: krdMetadataSchema,
    sessions: z.array(krdSessionSchema).optional(),
    laps: z.array(krdLapSchema).optional(),
    records: z.array(krdRecordSchema).optional(),
    events: z.array(krdEventSchema).optional(),
    extensions: krdExtensionsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const sport = value.metadata.sport;
    if (workoutLikeTypes.includes(value.type)) {
      if (!sport || sport.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: `KRD type "${value.type}" requires metadata.sport to be a non-empty string.`,
          path: ["metadata", "sport"],
        });
      }
    } else if (healthTypes.includes(value.type)) {
      if (sport && sport.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: `KRD type "${value.type}" must omit metadata.sport (health records have no associated sport).`,
          path: ["metadata", "sport"],
        });
      }
    }
  });

/**
 * TypeScript type for the complete KRD format, inferred from {@link krdSchema}.
 *
 * KRD (Kaiord Representation Definition) is the canonical JSON format for workout, activity, course, and health data.
 */
export type KRD = z.infer<typeof krdSchema>;

export { type KRDEvent, krdEventSchema } from "./event";
export {
  type KRDLap,
  krdLapSchema,
  type KRDLapTrigger,
  krdLapTriggerSchema,
} from "./lap";
export { type KRDMetadata, krdMetadataSchema } from "./metadata";
export { type KRDRecord, krdRecordSchema } from "./record";
export { type KRDSession, krdSessionSchema } from "./session";
