/**
 * The match half of a coach follow (design §3.1, §3.4): an unlocked match
 * takes the workout's new effective date with the same `updatedAt`. A locked
 * match — a recording linked, or the coach marked the activity completed —
 * keeps the day it was done on.
 */
import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";

export type FollowedMatchRepository = Pick<
  SessionMatchRepository,
  "getByWorkoutId" | "updateDate"
>;

export const redateFollowedMatch = async (
  sessionMatch: FollowedMatchRepository,
  workout: WorkoutRecord,
  activity: CoachingActivityRecord,
  updatedAt: string
): Promise<void> => {
  if (activity.status === "completed") return;
  const match = await sessionMatch.getByWorkoutId(
    workout.profileId,
    workout.id
  );
  if (!match || match.executedWorkoutIds.length > 0) return;
  if (match.date === activity.date) return;
  await sessionMatch.updateDate(match.id, activity.date, updatedAt);
};
