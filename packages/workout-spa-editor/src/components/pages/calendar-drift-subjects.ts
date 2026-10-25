import { isProjectedWorkoutRecord } from "../../application/coaching/activity-to-workout-record";
import { isMovableSession } from "../../application/session-movability";
import type { GarminDriftSubject } from "../../hooks/use-week-garmin-drift";
import type { CalendarBuckets } from "./calendar-buckets";

/**
 * The week's workouts that may show a Garmin date drift. A session that
 * cannot move is locked (design §3.1, AC-29), and a projected recording
 * has no workout of its own to have sent.
 */
export const calendarDriftSubjects = (
  buckets: Pick<
    CalendarBuckets,
    "matchedByDay" | "soloActualsByDay" | "executedRefIds"
  >
): GarminDriftSubject[] => [
  ...Object.values(buckets.matchedByDay)
    .flat()
    .map((s) => ({
      workout: s.workout,
      locked: !isMovableSession({
        ...s,
        recorded: buckets.executedRefIds.has(s.workout.id),
      }).movable,
    })),
  ...Object.values(buckets.soloActualsByDay)
    .flat()
    .map((w) => ({ workout: w, locked: isProjectedWorkoutRecord(w) })),
];
