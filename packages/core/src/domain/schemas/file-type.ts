import { z } from "zod";

/**
 * KRD `type` discriminator.
 *
 * The first three variants are the legacy workout/activity/course types
 * (KRD v1.x). The latter six are the health-metric types introduced in
 * KRD v2.0 (see the `health-data` capability). All nine values share the
 * same root KRD document shape; per-type invariants are enforced by the
 * `krdSchema` refinement (`metadata.sport` requirement) and by the
 * `extensions.health.*` discriminated union (`healthExtensionPayloadSchema`).
 */
export const fileTypeSchema = z.enum([
  "structured_workout",
  "recorded_activity",
  "course",
  "sleep_record",
  "weight_measurement",
  "hrv_summary",
  "daily_wellness",
  "body_composition",
  "stress_episode",
]);

export type FileType = z.infer<typeof fileTypeSchema>;

/**
 * Legacy workout/activity/course types that require `metadata.sport`.
 */
export const workoutLikeFileTypes = [
  "structured_workout",
  "recorded_activity",
  "course",
] as const satisfies readonly FileType[];

/**
 * Health-metric types introduced in KRD v2.0. They MUST NOT carry
 * `metadata.sport`; their payload lives in `extensions.health.<metric>`.
 */
export const healthFileTypes = [
  "sleep_record",
  "weight_measurement",
  "hrv_summary",
  "daily_wellness",
  "body_composition",
  "stress_episode",
] as const satisfies readonly FileType[];

export type HealthFileType = (typeof healthFileTypes)[number];

export const isHealthFileType = (value: FileType): value is HealthFileType =>
  (healthFileTypes as readonly FileType[]).includes(value);
