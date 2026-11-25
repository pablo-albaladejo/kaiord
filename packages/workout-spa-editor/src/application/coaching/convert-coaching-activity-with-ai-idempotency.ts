/**
 * Two-branch shape for `convertCoachingActivityWithAi` when a workout
 * already exists for the activity's namespaced sourceId:
 *
 *   - `ensureMatchForExisting` — guard branch. We NEVER rebuild an
 *     already-converted workout (per spa-coaching-integration
 *     "Idempotent re-click after success returns existing workout").
 *     The branch still auto-heals a missing SessionMatch — same
 *     retro-fix invariant the v10 migration applies in bulk.
 *
 *   - `processExistingRawInPlace` — raw re-process branch. Builds a row
 *     currently in `state="raw"` with the builder the create-new flow
 *     uses (the steps table, or the AI), writes the resulting KRD (already
 *     in the resolved sport) + aiMeta into the existing row via
 *     `transitionToStructured`, and leaves the existing `session_match`
 *     row untouched. A row that left `raw` during the build is not written
 *     and emits `skipped`.
 */
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { withFallbackName } from "../../utils/structured-workout";
import { updateWorkoutRecord } from "../save-workout-edits";
import { transitionToStructured } from "../workout-transitions";
import type { CoachingBuilder } from "./choose-coaching-builder";
import { pickAiMeta } from "./coaching-ai-meta";
import { buildAiFailure } from "./convert-coaching-activity-error-mapper";
import type {
  ConvertWithAiDeps,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";
import { ensureAutoCoachingMatch } from "./ensure-auto-coaching-match";

export const ensureMatchForExisting = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  existing: WorkoutRecord
): Promise<ConvertWithAiResult> => {
  await ensureAutoCoachingMatch(deps, activity, existing);
  deps.analytics.event("coaching.convert_with_ai.success", { created: false });
  return { ok: true, workoutId: existing.id, created: false };
};

export const processExistingRawInPlace = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  existingWorkout: WorkoutRecord,
  build: CoachingBuilder,
  abortSignal?: AbortSignal
): Promise<ConvertWithAiResult> => {
  try {
    const built = await build(abortSignal);
    const krd = withFallbackName(built.krd, activity.title);
    const aiMeta = built.aiMeta && pickAiMeta(built.aiMeta);
    // Onto the row as stored after the build: a move made meanwhile keeps
    // its date, and a row that left `raw` is left alone and reported as
    // skipped rather than as a success (AC-30).
    const written = await updateWorkoutRecord(
      deps,
      existingWorkout.id,
      (fresh) =>
        fresh.state === "raw"
          ? transitionToStructured(fresh, krd, aiMeta)
          : undefined
    );
    if (written)
      deps.analytics.event("coaching.convert_with_ai.success", {
        created: false,
      });
    else
      deps.analytics.event("coaching.convert_with_ai.skipped", {
        reason: "changed-meanwhile",
      });
    return { ok: true, workoutId: existingWorkout.id, created: false };
  } catch (err) {
    return buildAiFailure(deps.analytics, err);
  }
};
