/**
 * Internal helpers for `convertCoachingActivityWithAi`. Split from the
 * use-case file to keep it under the line caps; not public API.
 */
import { resolveT2GSport } from "../../adapters/train2go/train2go-krd-sport";
import type { AiMeta } from "../../types/calendar-fragments";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KRD } from "../../types/schemas";
import { coachingSportArgs, type ResolvedSport } from "./coaching-krd-sport";
import { buildStructuredCoachingWorkout } from "./coaching-workout-builder";
import { buildAiFailure } from "./convert-coaching-activity-error-mapper";
import type {
  ConvertWithAiDeps,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";
import { ensureSessionMatch } from "./ensure-session-match";

export const resolvePromptText = (activity: CoachingActivityRecord): string =>
  activity.description?.trim()
    ? activity.description
    : `${activity.title} (${activity.sport})`;

const persistFreshWorkout = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  nsSourceId: string,
  generated: { krd: KRD; aiMeta: AiMeta },
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
    date: activity.date,
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
  text: string,
  abortSignal: AbortSignal | undefined
): Promise<ConvertWithAiResult> => {
  const resolved = resolveT2GSport(activity.sport);
  let generated: { krd: KRD; aiMeta: AiMeta };
  try {
    generated = await deps.generateKrd({
      text,
      // Resolved KRD sport hint; raw Train2Go keys make the LLM guess
      // `generic`. Raw key kept only for unmapped sports.
      sport: resolved?.sport ?? activity.sport,
      abortSignal,
    });
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
