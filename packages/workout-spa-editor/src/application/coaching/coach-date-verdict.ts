/**
 * The follow-the-coach decision table (design §3.11) for one fetched date:
 * what to write on the workout and which move it counts as.
 */
import type { WorkoutRecord } from "../../types/calendar-record";

export type CoachDateVerdict = {
  write?: Pick<WorkoutRecord, "date" | "coachDate">;
  count?: "coachMoves" | "overriddenLocalMoves";
};

/** The decision table for one fetched date. */
export const coachDateVerdict = (
  workout: Pick<WorkoutRecord, "date" | "coachDate">,
  preUpsertDate: string | undefined,
  fetched: string
): CoachDateVerdict => {
  const baseline = workout.coachDate ?? preUpsertDate;
  const date = workout.date;
  if (baseline === undefined || baseline === fetched)
    return workout.coachDate === undefined
      ? { write: { date, coachDate: fetched } }
      : {};
  const moved = { write: { date: fetched, coachDate: fetched } };
  if (date === baseline) return { ...moved, count: "coachMoves" };
  if (date === fetched) return moved;
  return { ...moved, count: "overriddenLocalMoves" };
};
