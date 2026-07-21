import type { WhoopWorkout } from "../adapters/schemas/whoop-workout.schema";

/**
 * Scrubbed WHOOP cycle `workouts[]` entry (`sport_id: 33` = "Swimming" per
 * the live `sports/history` catalog). Values mirror the live shapes.
 */

export const WORKOUT_ACTIVITY_ID = "3f2a9c1e-6b4d-4a1a-9e2f-7c8d1a5b9e60";
export const WORKOUT_START_TIME = "2026-07-10T08:15:00.000Z";
export const WORKOUT_END_TIME = "2026-07-10T09:05:30.000Z";
export const WORKOUT_SPORT_ID = 33;
export const WORKOUT_SPORT_NAME = "Swimming";

export const WORKOUT_FIXTURE: WhoopWorkout = {
  during: `['${WORKOUT_START_TIME}','${WORKOUT_END_TIME}')`,
  timezone_offset: "+02:00",
  sport_id: WORKOUT_SPORT_ID,
  activity_id: WORKOUT_ACTIVITY_ID,
  kilojoules: 1250.5,
  average_heart_rate: 142,
  max_heart_rate: 168,
};
