import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { ConvertWithAiDeps } from "./convert-coaching-activity-with-ai-types";

/**
 * A Match left pointing at a deleted Workout would make `ensureSessionMatch`
 * skip the new one, leaving the Activity stuck: drop it first.
 */
export const dropDanglingMatch = async (
  deps: Pick<ConvertWithAiDeps, "sessionMatches" | "workouts">,
  activity: CoachingActivityRecord
): Promise<void> => {
  const match = await deps.sessionMatches.getByActivityId(
    activity.profileId,
    activity.id
  );
  if (match && !(await deps.workouts.getById(match.workoutId)))
    await deps.sessionMatches.delete(match.id);
};
