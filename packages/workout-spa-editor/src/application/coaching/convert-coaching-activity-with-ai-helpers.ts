/**
 * Internal helpers for `convertCoachingActivityWithAi`. Split from the
 * use-case file to keep it under the line caps; not public API.
 */
import { resolveT2GSport } from "../../adapters/train2go/train2go-krd-sport";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { CoachingBuild, CoachingBuilder } from "./choose-coaching-builder";
import { coachingSportArgs, type ResolvedSport } from "./coaching-krd-sport";
import { buildStructuredCoachingWorkout } from "./coaching-workout-builder";
import { buildAiFailure } from "./convert-coaching-activity-error-mapper";
import type {
  ConvertWithAiDeps,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";
import { dropDanglingMatch } from "./drop-dangling-match";
import { ensureSessionMatch } from "./ensure-session-match";
import { sessionMatchDate } from "./session-match-date";

/** The KRD sport a Train2Go key resolves to; `null` for unmapped sports. */
export const resolveCoachingSport = (
  activity: CoachingActivityRecord
): ResolvedSport | null => resolveT2GSport(activity.sport);

const persistFreshWorkout = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  nsSourceId: string,
  built: CoachingBuild,
  resolved: ResolvedSport | null
): Promise<string> => {
  const workout = buildStructuredCoachingWorkout({
    id: deps.newWorkoutId(),
    activity,
    namespacedSourceId: nsSourceId,
    aiMeta: built.aiMeta,
    now: deps.clock(),
    ...coachingSportArgs(built.krd, resolved, activity.sport),
  });
  await deps.workouts.put(workout);
  await dropDanglingMatch(deps, activity);
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
  build: CoachingBuilder,
  abortSignal: AbortSignal | undefined
): Promise<ConvertWithAiResult> => {
  let built: CoachingBuild;
  try {
    built = await build(abortSignal);
  } catch (err) {
    return buildAiFailure(deps.analytics, err);
  }
  const resolved = resolveT2GSport(activity.sport);
  const workoutId = await persistFreshWorkout(
    deps,
    activity,
    nsSourceId,
    built,
    resolved
  );
  deps.analytics.event("coaching.convert_with_ai.success", { created: true });
  return { ok: true, workoutId, created: true };
};
