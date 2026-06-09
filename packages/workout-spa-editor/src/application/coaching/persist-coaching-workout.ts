/**
 * persistCoachingWorkout — INSERT a coaching-derived workout from a
 * GIVEN (store) KRD plus its SessionMatch, used at SAVE.
 *
 * Unlike the entry-time `buildCoachingDraftKrd`, this persists the KRD
 * the user actually edited rather than rebuilding the template, so user
 * edits are carried through to the persisted record. The resolved sport
 * (from `buildCoachingDraftKrd`) sets a deterministic `record.sport`.
 *
 * Keeps the same `getBySourceId(source, namespaceSourceId(...))`
 * existence guard as the one-shot path (idempotency): if a workout
 * already exists for this activity it heals the match and returns it
 * instead of double-creating.
 */
import { namespaceSourceId } from "../../types/coaching-activity-record";
import type { KRD } from "../../types/krd";
import { buildCoachingDraftKrd } from "./build-coaching-draft-krd";
import { buildStructuredCoachingWorkout } from "./coaching-workout-builder";
import {
  handleExistingManualWorkout,
  manualMatchSource,
} from "./convert-coaching-activity-manual-helpers";
import type {
  CoachingActivityForConvert,
  ConvertManualDeps,
  ConvertManualResult,
} from "./convert-coaching-activity-manual-types";
import { ensureSessionMatch } from "./ensure-session-match";

export type PersistCoachingInput = {
  krd: KRD;
  activity: CoachingActivityForConvert;
};

export const persistCoachingWorkout = async (
  input: PersistCoachingInput,
  deps: ConvertManualDeps
): Promise<ConvertManualResult> => {
  const { activity } = input;
  const ns = namespaceSourceId(activity.profileId, activity.sourceId);
  const existing = await deps.workouts.getBySourceId(activity.source, ns);
  if (existing) return handleExistingManualWorkout(deps, activity, existing.id);

  const draft = buildCoachingDraftKrd(activity);
  if (!draft)
    throw new Error(
      `Cannot persist coaching workout for non-trainable activity: ${activity.id}`
    );

  const workout = buildStructuredCoachingWorkout({
    id: deps.newWorkoutId(),
    activity,
    namespacedSourceId: ns,
    krd: input.krd,
    aiMeta: null,
    now: deps.clock(),
    sport: draft.sport,
    subSport: draft.subSport,
  });
  await deps.workouts.put(workout);
  await ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: workout.id,
    date: activity.date,
    source: manualMatchSource,
    newId: deps.newMatchId,
    clock: deps.clock,
  });
  deps.analytics.event("coaching.convert_manual.success", { created: true });
  return { workoutId: workout.id, created: true };
};
