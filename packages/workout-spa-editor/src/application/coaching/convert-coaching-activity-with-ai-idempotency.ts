/**
 * Two-branch shape for `convertCoachingActivityWithAi` when a workout
 * already exists for the activity's namespaced sourceId:
 *
 *   - `ensureMatchForExisting` — guard branch. We NEVER re-bill the LLM
 *     on an already-converted workout (per spa-coaching-integration
 *     "Idempotent re-click after success returns existing workout").
 *     The branch still auto-heals a missing SessionMatch — same
 *     retro-fix invariant the v10 migration applies in bulk.
 *
 *   - `processExistingRawInPlace` — raw re-process branch. Bills the
 *     LLM for a row currently in `state="raw"`, writes the resulting
 *     KRD + aiMeta into the existing row via `transitionToStructured`,
 *     and leaves the existing `session_match` row untouched. Re-uses
 *     the same `generateKrd` port as the create-new flow so flow (f)
 *     of the coaching-dialog redesign is observable through the same
 *     route-mock surface as flow (a, c).
 */
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { transitionToStructured } from "../workout-transitions";
import { classifyAiFailure } from "./convert-coaching-activity-error-mapper";
import { resolvePromptText } from "./convert-coaching-activity-with-ai-helpers";
import type {
  ConvertWithAiDeps,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";
import { ensureSessionMatch } from "./ensure-session-match";

export const ensureMatchForExisting = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  workoutId: string
): Promise<ConvertWithAiResult> => {
  await ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId,
    date: activity.date,
    source: "auto-coaching",
    newId: deps.newMatchId,
    clock: deps.clock,
  });
  deps.analytics.event("coaching.convert_with_ai.success", { created: false });
  return { ok: true, workoutId, created: false };
};

export const processExistingRawInPlace = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  existingWorkout: WorkoutRecord,
  abortSignal?: AbortSignal
): Promise<ConvertWithAiResult> => {
  const text = resolvePromptText(activity);
  try {
    const generated = await deps.generateKrd({
      text,
      sport: activity.sport,
      abortSignal,
    });
    const updated = transitionToStructured(existingWorkout, generated.krd, {
      provider: generated.aiMeta.provider,
      model: generated.aiMeta.model,
      promptVersion: generated.aiMeta.promptVersion,
      processedAt: generated.aiMeta.processedAt,
    });
    await deps.workouts.put(updated);
    deps.analytics.event("coaching.convert_with_ai.success", {
      created: false,
    });
    return { ok: true, workoutId: updated.id, created: false };
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
};
