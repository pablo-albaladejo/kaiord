import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { ConvertWithAiDeps } from "./convert-coaching-activity-with-ai-types";
import { ensureSessionMatch } from "./ensure-session-match";
import { sessionMatchDate } from "./session-match-date";

/** The activity's auto-coaching Match to its Workout, written when missing. */
export const ensureAutoCoachingMatch = (
  deps: Pick<ConvertWithAiDeps, "sessionMatches" | "newMatchId" | "clock">,
  activity: CoachingActivityRecord,
  workout: WorkoutRecord
) =>
  ensureSessionMatch(deps.sessionMatches, {
    profileId: activity.profileId,
    coachingActivityId: activity.id,
    workoutId: workout.id,
    date: sessionMatchDate(workout, activity),
    source: "auto-coaching",
    newId: deps.newMatchId,
    clock: deps.clock,
  });
