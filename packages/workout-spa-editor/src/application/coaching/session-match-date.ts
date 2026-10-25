/**
 * The date a new match starts on (design §3.1, AC-27): a coach-built workout's
 * `date` is the session's effective date, so its match follows it; any other
 * workout — a recording linked by hand — keeps the activity's planned day.
 */
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";

export const sessionMatchDate = (
  workout: Pick<WorkoutRecord, "date" | "coachDate">,
  activity: Pick<CoachingActivityRecord, "date">
): string => (workout.coachDate !== undefined ? workout.date : activity.date);
