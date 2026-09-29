/**
 * The candidates of a bulk "Send week" (design §3.7, AC-42): every workout
 * of the visible week, past days included, in calendar order. `raw`,
 * `skipped` and `stale` are `not-eligible`, each with its state as the
 * reason — a `stale` workout needs the coach's change resolved first.
 */
import type { WorkoutRecord } from "../../types/calendar-record";

const NOT_ELIGIBLE_STATES = ["raw", "skipped", "stale"] as const;
export type NotEligibleReason = (typeof NOT_ELIGIBLE_STATES)[number];

export type WeekPushCandidate = {
  workoutId: string;
  date: string;
  notEligible?: NotEligibleReason;
};

const notEligibleReason = (
  state: WorkoutRecord["state"]
): NotEligibleReason | undefined =>
  NOT_ELIGIBLE_STATES.find((s) => s === state);

const byCalendarOrder = (a: WorkoutRecord, b: WorkoutRecord) =>
  a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);

export const selectWeekPushCandidates = (
  workouts: readonly WorkoutRecord[]
): WeekPushCandidate[] =>
  [...workouts].sort(byCalendarOrder).map((w) => {
    const reason = notEligibleReason(w.state);
    return {
      workoutId: w.id,
      date: w.date,
      ...(reason ? { notEligible: reason } : {}),
    };
  });
