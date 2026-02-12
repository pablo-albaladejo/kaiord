import type { Workout } from "@kaiord/core";
import type { GarminWorkoutParsed } from "../schemas/garmin-workout-parse.schema";

export const addPoolLength = (
  gcn: GarminWorkoutParsed,
  workout: Workout
): void => {
  const poolLength = gcn.poolLength;
  if (poolLength && poolLength > 0) {
    workout.poolLength = poolLength;
    workout.poolLengthUnit = "meters";
  }
};
