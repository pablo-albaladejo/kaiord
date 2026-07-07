/**
 * Projects an executed `ActivityRecord` into the WorkoutRecord shape the
 * calendar renders (executed slot of a matched card, or a solo actual).
 *
 * This reverses the transitional dual-write: instead of persisting a twin
 * WorkoutRecord, the calendar projects one on the fly from the activity, so
 * the render components stay unchanged and one event is stored once. Only
 * source-only activities (no twin, `linkedWorkoutId === null`) are projected;
 * historical twins still render through their own WorkoutRecord.
 */
import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRaw } from "../../types/calendar-fragments";
import type { WorkoutRecord } from "../../types/calendar-record";

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
): WorkoutRecord => ({
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
});
