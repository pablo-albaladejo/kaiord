import type { WorkoutSummary } from "@kaiord/core";

export const mapToWorkoutSummary = (garminWorkout: {
  workoutId?: number | string;
  workoutName?: string;
  sportType?: { sportTypeKey?: string };
  createdDate?: number | string;
  updatedDate?: number | string;
}): WorkoutSummary => ({
  id: String(garminWorkout.workoutId ?? ""),
  name: garminWorkout.workoutName ?? "Unnamed",
  sport: garminWorkout.sportType?.sportTypeKey ?? "unknown",
  created_at: garminWorkout.createdDate
    ? new Date(garminWorkout.createdDate).toISOString()
    : "",
  updated_at: garminWorkout.updatedDate
    ? new Date(garminWorkout.updatedDate).toISOString()
    : "",
});
