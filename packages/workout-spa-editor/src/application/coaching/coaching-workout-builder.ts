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
import type { KRD } from "../../types/schemas";

const buildRaw = (activity: CoachingActivityRecord): WorkoutRecord["raw"] => ({
  title: activity.title,
  description: activity.description ?? "",
  comments: [],
  distance: null,
  duration: null,
  prescribedRpe: null,
  rawHash: "",
});

export type StructuredCoachingWorkoutInput = {
  id: string;
  activity: CoachingActivityRecord;
  namespacedSourceId: string;
  krd: KRD;
  aiMeta: AiMeta | null;
  now: string;
};

export const buildStructuredCoachingWorkout = (
  input: StructuredCoachingWorkoutInput
): WorkoutRecord => ({
  id: input.id,
  date: input.activity.date,
  sport: input.activity.sport,
  source: input.activity.source,
  sourceId: input.namespacedSourceId,
  planId: null,
  state: "structured",
  raw: buildRaw(input.activity),
  krd: input.krd,
  lastProcessingError: null,
  feedback: null,
  aiMeta: input.aiMeta,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: input.now,
  modifiedAt: null,
  updatedAt: input.now,
});
