/**
 * Regenerate (spa-coaching-integration, "Regenerate an AI-built Workout"):
 * rebuild an existing Workout and replace it in place. It keeps its id, its
 * Day and its Match; a Workout on the watch goes back to Ready (the earlier
 * version stays in Garmin's library until the athlete removes it there), and
 * the hand edits it replaces are cleared. The caller confirmed first when
 * there were any. On a failed build nothing is written.
 */
import type { AiMeta } from "../../types/calendar-fragments";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KRD } from "../../types/schemas";
import {
  withCoachNotes,
  withFallbackName,
} from "../../utils/structured-workout";
import { updateWorkoutRecord } from "../save-workout-edits";
import type { CoachingBuilder } from "./choose-coaching-builder";
import { pickAiMeta } from "./coaching-ai-meta";
import { buildAiFailure } from "./convert-coaching-activity-error-mapper";
import type {
  ConvertWithAiDeps,
  ConvertWithAiResult,
} from "./convert-coaching-activity-with-ai-types";
import { ensureAutoCoachingMatch } from "./ensure-auto-coaching-match";
import { canRegenerate } from "./regenerate-warnings";

/** Named after the activity when the build gives no name, with its notes. */
const regeneratedKrd = (krd: KRD, activity: CoachingActivityRecord): KRD =>
  withCoachNotes(withFallbackName(krd, activity.title), activity.description);

const regeneratedRecord = (
  fresh: WorkoutRecord,
  krd: KRD,
  aiMeta: AiMeta | null,
  now: string
): WorkoutRecord | undefined =>
  !canRegenerate(fresh.state)
    ? undefined
    : {
        ...fresh,
        state: "structured",
        krd,
        aiMeta,
        garminPushId: null,
        previousState: null,
        lastProcessingError: null,
        modifiedAt: null,
        updatedAt: now,
      };

export const regenerateInPlace = async (
  deps: ConvertWithAiDeps,
  activity: CoachingActivityRecord,
  existing: WorkoutRecord,
  build: CoachingBuilder,
  abortSignal?: AbortSignal
): Promise<ConvertWithAiResult> => {
  let aiMeta: AiMeta | null;
  try {
    const built = await build(abortSignal);
    const krd = regeneratedKrd(built.krd, activity);
    aiMeta = built.aiMeta && pickAiMeta(built.aiMeta);
    await updateWorkoutRecord(deps, existing.id, (fresh) =>
      regeneratedRecord(fresh, krd, aiMeta, deps.clock())
    );
  } catch (err) {
    return buildAiFailure(deps.analytics, err);
  }
  await ensureAutoCoachingMatch(deps, activity, existing);
  deps.analytics.event("coaching.convert_with_ai.success", {
    created: false,
    regenerated: true,
    ai: aiMeta !== null,
  });
  return { ok: true, workoutId: existing.id, created: false };
};
