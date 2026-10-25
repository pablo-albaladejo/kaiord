/**
 * Whether the UI may offer a move for a matched session (design §3.8). It
 * mirrors `moveSession`'s guards so a done session gets no drag binding and
 * a disabled dialog action instead of a refused write. A projected workout
 * has no record to move.
 */
import type { WorkoutRecord } from "../types/calendar-record";
import type { ActivityStatus } from "../types/coaching-activity";
import { isProjectedWorkoutRecord } from "./coaching/activity-to-workout-record";

export type NotMovableReason = "executed" | "completed" | "projected";

export type Movability =
  { movable: true } | { movable: false; reason: NotMovableReason };

export type MovabilityInput = {
  workout: WorkoutRecord;
  activity: { status: ActivityStatus };
  executed?: readonly unknown[];
  match?: { executedWorkoutIds?: readonly string[] };
};

const hasExecutedSlot = (s: MovabilityInput): boolean =>
  (s.executed?.length ?? 0) > 0 ||
  (s.match?.executedWorkoutIds?.length ?? 0) > 0;

export const isMovableSession = (s: MovabilityInput): Movability => {
  if (isProjectedWorkoutRecord(s.workout))
    return { movable: false, reason: "projected" };
  if (hasExecutedSlot(s)) return { movable: false, reason: "executed" };
  if (s.activity.status === "completed")
    return { movable: false, reason: "completed" };
  return { movable: true };
};

/** The athlete moved it off the coach's day (design §3.13, AC-17). */
export const isAthleteMoved = (w: Pick<WorkoutRecord, "date" | "coachDate">) =>
  w.coachDate !== undefined && w.date !== w.coachDate;
