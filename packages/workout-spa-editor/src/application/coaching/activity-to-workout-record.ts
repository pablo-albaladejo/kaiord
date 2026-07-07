/**
 * Projects an executed `ActivityRecord` into the WorkoutRecord shape the
 * calendar renders (executed slot of a matched card, or a solo actual).
 *
 * This reverses the transitional dual-write: instead of persisting a twin
 * WorkoutRecord, the calendar projects one on the fly from the activity, so
 * the render components stay unchanged and one event is stored once. Only
 * source-only activities (no twin, `linkedWorkoutId === null`) are projected;
 * historical twins still render through their own WorkoutRecord.
 *
 * The projected record's `id` lives in the `activities` table, not
 * `workouts` — it was never persisted as a workout, so it cannot be
 * opened in the editor (which reads `workouts` by id) nor rescheduled
 * (`rescheduleWorkout` reads the same table). `projectedFromActivity`
 * marks that, so callers can route clicks/drag away from those flows
 * without changing `WorkoutRecord`'s own persisted schema.
 */
import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRaw } from "../../types/calendar-fragments";
import type { WorkoutRecord } from "../../types/calendar-record";

export type ProjectedWorkoutRecord = WorkoutRecord & {
  readonly projectedFromActivity: true;
};

export const isProjectedWorkoutRecord = (
  workout: WorkoutRecord
): workout is ProjectedWorkoutRecord =>
  (workout as Partial<ProjectedWorkoutRecord>).projectedFromActivity === true;

const buildRaw = (activity: ActivityRecord): WorkoutRaw => ({
  title: activity.sport,
  description: "",
  comments: [],
  distance:
    activity.distanceMeters !== undefined
      ? { value: activity.distanceMeters, unit: "m" }
      : null,
  duration:
    activity.durationSeconds !== undefined
      ? { value: activity.durationSeconds, unit: "s" }
      : null,
  prescribedRpe: null,
  rawHash: activity.externalId,
});

export const activityToWorkoutRecord = (
  activity: ActivityRecord
): ProjectedWorkoutRecord => ({
  id: activity.id,
  profileId: activity.profileId,
  date: activity.date,
  sport: activity.sport,
  source: activity.sourceBridgeId,
  sourceId: activity.externalId,
  planId: null,
  state: "structured",
  raw: buildRaw(activity),
  krd: activity.krd,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: activity.createdAt,
  modifiedAt: null,
  updatedAt: activity.createdAt,
  projectedFromActivity: true,
});
