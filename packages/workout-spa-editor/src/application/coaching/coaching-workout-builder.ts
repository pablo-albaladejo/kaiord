/**
 * Builders for coaching-derived workout records.
 *
 * Both AI and Manual paths persist a `state="structured"` workout that
 * mirrors the source `activity.description` into `raw.description`
 * (per spa-coaching-integration: "Coach description preserved in raw
 * for sidebar"). The legacy convert path uses its own builder in
 * `convert-coaching-activity.ts`.
 */

import type { AiMeta } from "../../types/calendar-fragments";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KRD, Sport, SubSport } from "../../types/schemas";
import { withCoachNotes } from "../../utils/structured-workout";

const buildRaw = (activity: CoachingActivityRecord): WorkoutRecord["raw"] => ({
  title: activity.title,
  description: activity.description ?? "",
  comments: [],
  distance: null,
  duration: null,
  prescribedRpe: null,
  rawHash: "",
});

export type RawCoachingWorkoutInput = {
  id: string;
  activity: CoachingActivityRecord;
  namespacedSourceId: string;
  now: string;
};

export type StructuredCoachingWorkoutInput = RawCoachingWorkoutInput & {
  krd: KRD;
  aiMeta: AiMeta | null;
  // Resolved KRD sport (NOT the raw Train2Go key on activity.sport) so the
  // record carries the same sport as its KRD instead of collapsing to a raw
  // key the calendar/filters cannot interpret.
  sport: Sport;
  subSport?: SubSport;
};

/** The fields both builders share: identity, dates, source and stamps. */
const baseRecord = (input: RawCoachingWorkoutInput) => ({
  id: input.id,
  profileId: input.activity.profileId,
  date: input.activity.date,
  coachDate: input.activity.date,
  source: input.activity.source,
  sourceId: input.namespacedSourceId,
  planId: null,
  raw: buildRaw(input.activity),
  lastProcessingError: null,
  feedback: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: input.now,
  modifiedAt: null,
  updatedAt: input.now,
});

export const buildStructuredCoachingWorkout = (
  input: StructuredCoachingWorkoutInput
): WorkoutRecord => ({
  ...baseRecord(input),
  sport: input.sport,
  state: "structured",
  // Coach description is the canonical workout-level note (krd-format); also
  // mirrored into raw.description for the sidebar.
  krd: withCoachNotes(input.krd, input.activity.description),
  aiMeta: input.aiMeta,
});

/**
 * Raw-only coaching workout (no structured KRD). Used for non-trainable
 * activities such as rest days, where building a KRD would be dishonest.
 */
export const buildRawCoachingWorkout = (
  input: RawCoachingWorkoutInput
): WorkoutRecord => ({
  ...baseRecord(input),
  sport: input.activity.sport,
  state: "raw",
  krd: null,
  aiMeta: null,
});
