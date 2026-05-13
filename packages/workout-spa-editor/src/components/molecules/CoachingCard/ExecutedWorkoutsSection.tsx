/**
 * ExecutedWorkoutsSection — matched-state dialog row(s) listing the
 * executed activities (e.g., Garmin/FIT recordings) auto-linked to the
 * same `(profileId, date, canonical sport)` slot as the structured
 * workout. Mirrors the calendar-card `matched-session-executed-row`
 * layout but uses a slate border to distinguish it from the emerald
 * "Linked workout" section. Each row is a button that invokes
 * `onOpenExecuted` so the user can open the recorded workout the same
 * way clicking a solo `WorkoutCard` does.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import {
  formatDurationMinutes,
  sportLabel,
  workoutTitle,
} from "./linked-workout-utils";

export type ExecutedWorkoutsSectionProps = {
  executed: readonly WorkoutRecord[];
  onOpenExecuted: (workout: WorkoutRecord) => void;
};

export function ExecutedWorkoutsSection({
  executed,
  onOpenExecuted,
}: ExecutedWorkoutsSectionProps) {
  if (executed.length === 0) return null;
  return (
    <div
      data-testid="executed-workouts-section"
      className="space-y-2 rounded border border-slate-200 bg-slate-50/40 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/30"
    >
      <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        Completed activities
      </div>
      <ul className="space-y-1">
        {executed.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              data-testid={`executed-workout-${w.id}`}
              onClick={() => onOpenExecuted(w)}
              className="flex w-full flex-col items-start rounded px-2 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="font-medium">{workoutTitle(w)}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {sportLabel(w.sport)}
                {formatDurationMinutes(w.raw?.duration?.value) &&
                  ` · ${formatDurationMinutes(w.raw?.duration?.value)}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
