/**
 * Internal helpers for `convertCoachingActivityWithAi`. Split from the
 * use-case file to keep the orchestrator under per-file/per-function
 * line caps; not part of the public application API.
 */
import type { AiMeta } from "../../types/calendar-fragments";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KRD } from "../../types/schemas";
import { buildStructuredCoachingWorkout } from "./coaching-workout-builder";
import { classifyAiFailure } from "./convert-coaching-activity-error-mapper";
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
  generated: { krd: KRD; aiMeta: AiMeta }
): Promise<string> => {
  const workout = buildStructuredCoachingWorkout({
    id: deps.newWorkoutId(),
    activity,
    namespacedSourceId: nsSourceId,
    krd: generated.krd,
    aiMeta: generated.aiMeta,
    now: deps.clock(),
  });
  await deps.workouts.put(workout);
  await ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: workout.id,
    date: activity.date,
    source: "auto-conversion",
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
  let generated: { krd: KRD; aiMeta: AiMeta };
  try {
    generated = await deps.generateKrd({
      text,
      sport: activity.sport,
      abortSignal,
    });
  } catch (err) {
    const reason = classifyAiFailure(err);
    const eventName =
      reason === "ai-cancelled"
        ? "coaching.convert_with_ai.cancelled"
        : "coaching.convert_with_ai.failure";
    deps.analytics.event(eventName, { reason });
    return {
      ok: false,
      reason,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  const workoutId = await persistFreshWorkout(
    deps,
    activity,
    nsSourceId,
    generated
  );
  deps.analytics.event("coaching.convert_with_ai.success", { created: true });
  return { ok: true, workoutId, created: true };
};
