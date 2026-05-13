/**
 * Shared display helpers for matched-state dialog sections
 * (`LinkedWorkoutSection`, `ExecutedWorkoutsSection`). Extracted so both
 * the structured and executed slots share the same title/sport/duration
 * formatting and the per-file line caps stay satisfied.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";

const SPORT_LABELS: Record<string, string> = {
  cycling: "Cycling",
  running: "Running",
  swimming: "Swimming",
  strength: "Strength",
};

export const formatDurationMinutes = (seconds: number | undefined): string => {
  if (!seconds) return "";
  const min = Math.round(seconds / 60);
  return `${min}min`;
};

export const sportLabel = (sport: string | null | undefined): string => {
  if (!sport) return "Workout";
  return SPORT_LABELS[sport] ?? sport;
};

export const workoutTitle = (workout: WorkoutRecord): string => {
  const raw = workout.raw as { title?: string; description?: string } | null;
  return raw?.title || raw?.description?.slice(0, 60) || "Untitled workout";
};
