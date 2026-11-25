/**
 * Internal helpers for `convertCoachingActivityWithAi`. Split from the
 * use-case file to keep it under the line caps; not public API.
 */
import { resolveT2GSport } from "../../adapters/train2go/train2go-krd-sport";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { Sport } from "../../types/schemas";
import type { CoachingBuild, CoachingBuilder } from "./choose-coaching-builder";
import type { ResolvedSport } from "./coaching-krd-sport";
import { buildStructuredCoachingWorkout } from "./coaching-workout-builder";
import { buildAiFailure } from "./convert-coaching-activity-error-mapper";
import type {
  ConvertWithAiDeps,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";
import { dropDanglingMatch } from "./drop-dangling-match";
import { ensureAutoCoachingMatch } from "./ensure-auto-coaching-match";

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
  // The build already carries the resolved sport; the record carries it too.
  const workout = buildStructuredCoachingWorkout({
    id: deps.newWorkoutId(),
    activity,
    namespacedSourceId: nsSourceId,
    aiMeta: built.aiMeta,
    now: deps.clock(),
    krd: built.krd,
    ...(resolved ?? { sport: activity.sport as Sport }),
  });
  await deps.workouts.put(workout);
  await dropDanglingMatch(deps, activity);
  await ensureAutoCoachingMatch(deps, activity, workout);
  return workout.id;
};

export const performAiCreation = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  nsSourceId: string,
  build: CoachingBuilder,
  resolved: ResolvedSport | null,
  abortSignal: AbortSignal | undefined
): Promise<ConvertWithAiResult> => {
  let built: CoachingBuild;
  try {
    built = await build(abortSignal);
  } catch (err) {
    return buildAiFailure(deps.analytics, err);
  }
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
