/**
 * convertCoachingActivityManual — application use case.
 *
 * Synchronous coaching → workout path that skips the LLM. Persists a
 * `state="structured"` workout seeded with a 1-step KRD warmup template
 * AND its SessionMatch, so the editor renders a non-empty starting
 * point and the calendar bucketer collapses the activity↔workout pair
 * into one card (per spa-coaching-integration).
 *
 * The coach description is mirrored into `raw.description` so the
 * EditorPage sidebar can render it alongside the KRD step list.
 */
import { namespaceSourceId } from "../../types/coaching-activity-record";
import { buildCoachingTemplateKrd } from "./coaching-template";
import { buildStructuredCoachingWorkout } from "./coaching-workout-builder";
import {
  handleExistingManualWorkout,
  manualMatchSource,
} from "./convert-coaching-activity-manual-helpers";
import type {
  CoachingActivityForConvert,
  ConvertManualDeps,
  ConvertManualInput,
  ConvertManualResult,
} from "./convert-coaching-activity-manual-types";
import { ensureSessionMatch } from "./ensure-session-match";

export type {
  ConvertManualDeps,
  ConvertManualInput,
  ConvertManualResult,
} from "./convert-coaching-activity-manual-types";

const createNewWorkout = async (
  deps: ConvertManualDeps,
  activity: CoachingActivityForConvert,
  ns: string
): Promise<ConvertManualResult> => {
  const workout = buildStructuredCoachingWorkout({
    id: deps.newWorkoutId(),
    activity,
    namespacedSourceId: ns,
    krd: buildCoachingTemplateKrd(activity.sport),
    aiMeta: null,
    now: deps.clock(),
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

export const convertCoachingActivityManual = async (
  input: ConvertManualInput,
  deps: ConvertManualDeps
): Promise<ConvertManualResult> => {
  // Existence guard runs BEFORE the `invoked` analytics event so a
  // missing activity does not produce an orphaned invoked → no
  // success/failure pair (telemetry contract).
  const activity = await deps.coaching.getById(input.activityId);
  if (!activity)
    throw new Error(`Coaching activity not found: ${input.activityId}`);

  deps.analytics.event("coaching.convert_manual.invoked");

  const ns = namespaceSourceId(activity.profileId, activity.sourceId);
  const existing = await deps.workouts.getBySourceId(activity.source, ns);
  if (existing) return handleExistingManualWorkout(deps, activity, existing.id);
  return createNewWorkout(deps, activity, ns);
};
