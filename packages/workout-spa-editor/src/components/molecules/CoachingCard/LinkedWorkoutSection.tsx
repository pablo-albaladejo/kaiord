/**
 * LinkedWorkoutSection — matched-state body for `CoachingActivityDialog`.
 * Shows the matched workout's title, sport, and duration; renders a
 * "Split" button that disables itself while `unmatchSession` is in
 * flight.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import {
  formatDurationMinutes,
  sportLabel,
  workoutTitle,
} from "./linked-workout-utils";

export type LinkedWorkoutSectionProps = {
  workout: WorkoutRecord;
  splitting: boolean;
  onSplit: () => void;
};

export function LinkedWorkoutSection({
  workout,
  splitting,
  onSplit,
}: LinkedWorkoutSectionProps) {
  const t = useTranslate("coaching");
  const duration = formatDurationMinutes(workout.raw?.duration?.value);
  return (
    <div
      data-testid="linked-workout-section"
      className="space-y-2 rounded border border-emerald-200 bg-emerald-50/40 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30"
    >
      <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        {t("linked.heading")}
      </div>
      <div className="font-medium">{workoutTitle(workout, t)}</div>
      <div className="text-xs text-slate-600 dark:text-slate-400">
        {sportLabel(workout.sport, t)}
        {duration && ` · ${duration}`}
      </div>
      <div className="pt-1">
        <button
          type="button"
          disabled={splitting}
          onClick={onSplit}
          className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {splitting ? t("actions.splitting") : t("actions.split")}
        </button>
      </div>
    </div>
  );
}
