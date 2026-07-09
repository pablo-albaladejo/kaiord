/**
 * Shared display helpers for matched-state dialog sections
 * (`LinkedWorkoutSection`, `ExecutedWorkoutsSection`). Extracted so both
 * the structured and executed slots share the same title/sport/duration
 * formatting and the per-file line caps stay satisfied.
 */

import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";

export const formatDurationMinutes = (seconds: number | undefined): string => {
  if (!seconds) return "";
  const min = Math.round(seconds / 60);
  return `${min}min`;
};

export const sportLabel = (
  sport: string | null | undefined,
  t: Translate = getTranslate("coaching")
): string => {
  if (!sport) return t("linked.fallbackTitle");
  const label = t(`linked.${sport}`);
  return label === `linked.${sport}` ? sport : label;
};

export const workoutTitle = (
  workout: WorkoutRecord,
  t: Translate = getTranslate("coaching")
): string => {
  const raw = workout.raw as { title?: string; description?: string } | null;
  return raw?.title || raw?.description?.slice(0, 60) || t("linked.untitled");
};
