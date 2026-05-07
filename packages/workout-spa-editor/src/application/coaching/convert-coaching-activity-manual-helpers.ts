/**
 * Helpers extracted from `convertCoachingActivityManual` so that
 * the use-case file stays under the per-file line cap.
 */
import type { SessionMatchSource } from "../../types/session-match";
import type {
  CoachingActivityForConvert,
  ConvertManualDeps,
  ConvertManualResult,
} from "./convert-coaching-activity-manual-types";
import { ensureSessionMatch } from "./ensure-session-match";

export const manualMatchSource: SessionMatchSource = "auto-conversion";

export const handleExistingManualWorkout = async (
  deps: ConvertManualDeps,
  activity: CoachingActivityForConvert,
  existingWorkoutId: string
): Promise<ConvertManualResult> => {
  await ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: existingWorkoutId,
    date: activity.date,
    source: manualMatchSource,
    newId: deps.newMatchId,
    clock: deps.clock,
  });
  deps.analytics.event("coaching.convert_manual.success", { created: false });
  return { workoutId: existingWorkoutId, created: false };
};
