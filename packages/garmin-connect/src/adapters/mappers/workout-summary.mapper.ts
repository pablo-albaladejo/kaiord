import type { WorkoutSummary } from "@kaiord/core";
import { mapGarminSportToKrd } from "@kaiord/garmin";

export const mapToWorkoutSummary = (garminWorkout: {
  workoutId?: number | string;
  workoutName?: string;
  sportType?: { sportTypeKey?: string };
  createdDate?: number | string;
  updatedDate?: number | string;
}): WorkoutSummary => ({
  id: String(garminWorkout.workoutId ?? ""),
  name: garminWorkout.workoutName ?? "Unnamed",
  // Translate the raw Garmin sport key to KRD sport vocabulary so the summary
  // speaks the domain, not the SDK. Absent keys keep the documented "unknown"
  // fallback rather than mapping to a sport.
  sport: garminWorkout.sportType?.sportTypeKey
    ? mapGarminSportToKrd(garminWorkout.sportType.sportTypeKey)
    : "unknown",
  created_at: garminWorkout.createdDate
    ? new Date(garminWorkout.createdDate).toISOString()
    : "",
  updated_at: garminWorkout.updatedDate
    ? new Date(garminWorkout.updatedDate).toISOString()
    : "",
});
