/**
 * Idempotency branch for `convertCoachingActivityWithAi`: when a
 * workout already exists for the activity's namespaced sourceId, we
 * never re-bill the LLM (per spa-coaching-integration "Idempotent
 * re-click after success returns existing workout"). We DO ensure
 * the SessionMatch exists, auto-healing legacy converted-without-
 * match data per the same retro-fix invariant the v10 migration
 * applies in bulk.
 */
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
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
