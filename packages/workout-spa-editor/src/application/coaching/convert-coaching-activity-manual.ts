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
import type {
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

const ensureMatch = (
  deps: ConvertManualDeps,
  profileId: string,
  coachingActivityId: string,
  workoutId: string,
  date: string
): Promise<{ created: boolean }> =>
  ensureSessionMatch(deps.sessionMatches, {
    profileId,
    coachingActivityId,
    workoutId,
    date,
    source: "auto-conversion",
    newId: deps.newMatchId,
    clock: deps.clock,
  });

export const convertCoachingActivityManual = async (
  input: ConvertManualInput,
  deps: ConvertManualDeps
): Promise<ConvertManualResult> => {
  deps.analytics.event("coaching.convert_manual.invoked");
  const activity = await deps.coaching.getById(input.activityId);
  if (!activity)
    throw new Error(`Coaching activity not found: ${input.activityId}`);

  const ns = namespaceSourceId(activity.profileId, activity.sourceId);
  const existing = await deps.workouts.getBySourceId(activity.source, ns);
  if (existing) {
    await ensureMatch(
      deps,
      activity.profileId,
      activity.id,
      existing.id,
      activity.date
    );
    deps.analytics.event("coaching.convert_manual.success", { created: false });
    return { workoutId: existing.id, created: false };
  }

  const workout = buildStructuredCoachingWorkout({
    id: deps.newWorkoutId(),
    activity,
    namespacedSourceId: ns,
    krd: buildCoachingTemplateKrd(activity.sport),
    aiMeta: null,
    now: deps.clock(),
  });
  await deps.workouts.put(workout);
  await ensureMatch(
    deps,
    activity.profileId,
    activity.id,
    workout.id,
    activity.date
  );
  deps.analytics.event("coaching.convert_manual.success", { created: true });
  return { workoutId: workout.id, created: true };
};
