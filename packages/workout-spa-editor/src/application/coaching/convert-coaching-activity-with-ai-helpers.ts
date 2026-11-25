/**
 * Internal helpers for `convertCoachingActivityWithAi`. Split from the
 * use-case file to keep it under the line caps; not public API.
 */
import { resolveT2GSport } from "../../adapters/train2go/train2go-krd-sport";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { type CoachingKrd, generateCoachingKrd } from "./coaching-krd-source";
import { coachingSportArgs, type ResolvedSport } from "./coaching-krd-sport";
import { buildStructuredCoachingWorkout } from "./coaching-workout-builder";
import { buildAiFailure } from "./convert-coaching-activity-error-mapper";
import type {
  ConvertWithAiDeps,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";
import { ensureSessionMatch } from "./ensure-session-match";
import { sessionMatchDate } from "./session-match-date";

const persistFreshWorkout = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  nsSourceId: string,
  generated: CoachingKrd,
  resolved: ResolvedSport | null
): Promise<string> => {
  const workout = buildStructuredCoachingWorkout({
    id: deps.newWorkoutId(),
    activity,
    namespacedSourceId: nsSourceId,
    aiMeta: generated.aiMeta,
    now: deps.clock(),
    ...coachingSportArgs(generated.krd, resolved, activity.sport),
  });
  await deps.workouts.put(workout);
  await ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: workout.id,
    date: sessionMatchDate(workout, activity),
    source: "auto-coaching",
    newId: deps.newMatchId,
    clock: deps.clock,
  });
  return workout.id;
};

export const performAiCreation = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  nsSourceId: string,
  abortSignal: AbortSignal | undefined
): Promise<ConvertWithAiResult> => {
  const resolved = resolveT2GSport(activity.sport);
  let generated: CoachingKrd;
  try {
    generated = await generateCoachingKrd(
      deps,
      { activity, resolved },
      abortSignal
    );
  } catch (err) {
    return buildAiFailure(deps.analytics, err);
  }
  const workoutId = await persistFreshWorkout(
    deps,
    activity,
    nsSourceId,
    generated,
    resolved
  );
  deps.analytics.event("coaching.convert_with_ai.success", { created: true });
  return { ok: true, workoutId, created: true };
};
