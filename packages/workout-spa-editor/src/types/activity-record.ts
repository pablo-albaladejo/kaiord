/**
 * ActivityRecord — persisted shape for an executed activity (v27 `activities`).
 *
 * Stored with provenance (`sourceBridgeId` + content-hash `externalId`)
 * mirroring the health-record shape, so re-importing the same file is a
 * no-op. The full recorded `krd` is attached when available; summary fields
 * are lifted from the first session for cheap calendar/list reads.
 */

import { z } from "zod";

import type { KRD } from "./krd";
import { krdSchema } from "./schemas";

export const activityRecordSchema = z.object({
  id: z.uuid(),
  profileId: z.string().min(1),
  date: z.iso.date(),
  sport: z.string(),
  /** Provenance: the source that produced this executed activity. */
  sourceBridgeId: z.string().min(1),
  /** Content-hash natural key for dedup (mirrors the health-record shape). */
  externalId: z.string().min(1),
  durationSeconds: z.number().nonnegative().optional(),
  distanceMeters: z.number().nonnegative().optional(),
  /**
   * Id of the transitional twin WorkoutRecord written for the same event
   * (dual-write). The executed-match union excludes this workout from the
   * legacy scan so one event is never matched twice. `null` for source-only
   * activities with no twin (e.g. a future Garmin pull).
   */
  linkedWorkoutId: z.uuid().nullable(),
  krd: krdSchema.nullable(),
  createdAt: z.iso.datetime(),
});

export type ActivityRecord = z.infer<typeof activityRecordSchema>;

export type BuildActivityRecordInput = {
  profileId: string;
  date: string;
  sport: string;
  sourceBridgeId: string;
  externalId: string;
  linkedWorkoutId: string | null;
  krd: KRD;
};

/** Build a fresh ActivityRecord, lifting summary fields from the first session. */
export const buildActivityRecord = (
  input: BuildActivityRecordInput
): ActivityRecord => {
  const session = input.krd.sessions?.[0];
  return {
    id: crypto.randomUUID(),
    profileId: input.profileId,
    date: input.date,
    sport: input.sport,
    sourceBridgeId: input.sourceBridgeId,
    externalId: input.externalId,
    durationSeconds: session?.totalElapsedTime,
    distanceMeters: session?.totalDistance,
    linkedWorkoutId: input.linkedWorkoutId,
    krd: input.krd,
    createdAt: new Date().toISOString(),
  };
};

export type BuildSourceActivityRecordInput = {
  profileId: string;
  date: string;
  sport: string;
  sourceBridgeId: string;
  externalId: string;
  durationSeconds?: number;
  distanceMeters?: number;
};

/**
 * Build a summary-only ActivityRecord for a source pull (e.g. Garmin): no
 * recorded KRD and no twin WorkoutRecord (`linkedWorkoutId: null`). The
 * calendar renders it natively from the summary fields.
 */
export const buildSourceActivityRecord = (
  input: BuildSourceActivityRecordInput
): ActivityRecord => ({
  id: crypto.randomUUID(),
  profileId: input.profileId,
  date: input.date,
  sport: input.sport,
  sourceBridgeId: input.sourceBridgeId,
  externalId: input.externalId,
  durationSeconds: input.durationSeconds,
  distanceMeters: input.distanceMeters,
  linkedWorkoutId: null,
  krd: null,
  createdAt: new Date().toISOString(),
});
