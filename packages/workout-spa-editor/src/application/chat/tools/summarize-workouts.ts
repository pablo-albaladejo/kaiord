/**
 * Pure workout summarizer for the chat read tool.
 *
 * Turns profile-scoped workout records into compact summaries plus
 * aggregates (count, total and longest duration) so the model can answer
 * questions like "what was my longest workout?" without the full row set
 * being serialized into the prompt. The row list is capped; the aggregates
 * are computed over every record, so a "longest" answer is correct even
 * when the longest workout falls outside the capped list.
 */
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { Workout } from "../../../types/krd";
import { calculateWorkoutStats } from "../../../utils/workout-stats";

const ROW_BUDGET = 50;

export type WorkoutSummary = {
  date: string;
  sport: string;
  name: string | null;
  state: string;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

export type WorkoutsSummary = {
  count: number;
  totalDurationSeconds: number;
  longest: WorkoutSummary | null;
  workouts: WorkoutSummary[];
};

const workoutOf = (record: WorkoutRecord): Workout | null =>
  (record.krd?.extensions?.structured_workout as Workout | undefined) ?? null;

const toSummary = (record: WorkoutRecord): WorkoutSummary => {
  const workout = workoutOf(record);
  const stats = calculateWorkoutStats(workout);
  return {
    date: record.date,
    sport: record.sport,
    name: workout?.name ?? null,
    state: record.state,
    durationSeconds: stats.totalDuration,
    distanceMeters: stats.totalDistance,
  };
};

const longestOf = (rows: WorkoutSummary[]): WorkoutSummary | null =>
  rows.reduce<WorkoutSummary | null>((best, row) => {
    if (row.durationSeconds === null) return best;
    if (best === null || row.durationSeconds > (best.durationSeconds ?? 0)) {
      return row;
    }
    return best;
  }, null);

export const summarizeWorkouts = (
  records: WorkoutRecord[]
): WorkoutsSummary => {
  const all = records.map(toSummary);
  const totalDurationSeconds = all.reduce(
    (sum, row) => sum + (row.durationSeconds ?? 0),
    0
  );
  const byDateAsc = [...all].sort((a, b) => a.date.localeCompare(b.date));
  return {
    count: all.length,
    totalDurationSeconds,
    longest: longestOf(all),
    workouts: byDateAsc.slice(-ROW_BUDGET),
  };
};
