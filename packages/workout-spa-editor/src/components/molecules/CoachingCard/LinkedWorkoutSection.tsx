/**
 * LinkedWorkoutSection — matched-state body for `CoachingActivityDialog`.
 * Shows the matched workout's title, sport, and duration; renders a
 * "Split" button that disables itself while `unmatchSession` is in
 * flight.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";

export type LinkedWorkoutSectionProps = {
  workout: WorkoutRecord;
  splitting: boolean;
  onSplit: () => void;
};

const SPORT_LABELS: Record<string, string> = {
  cycling: "Cycling",
  running: "Running",
  swimming: "Swimming",
  strength: "Strength",
};

const formatDuration = (seconds: number | undefined): string => {
  if (!seconds) return "";
  const min = Math.round(seconds / 60);
  return `${min}min`;
};

const sportLabel = (sport: string | null | undefined): string => {
  if (!sport) return "Workout";
  return SPORT_LABELS[sport] ?? sport;
};

const workoutTitle = (workout: WorkoutRecord): string => {
  const raw = workout.raw as { title?: string; description?: string } | null;
  return raw?.title || raw?.description?.slice(0, 60) || "Untitled workout";
};

export function LinkedWorkoutSection({
  workout,
  splitting,
  onSplit,
}: LinkedWorkoutSectionProps) {
  const duration = formatDuration(workout.raw?.duration?.value);
  return (
    <div
      data-testid="linked-workout-section"
      className="space-y-2 rounded border border-emerald-200 bg-emerald-50/40 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30"
    >
      <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        Linked workout
      </div>
      <div className="font-medium">{workoutTitle(workout)}</div>
      <div className="text-xs text-slate-600 dark:text-slate-400">
        {sportLabel(workout.sport)}
        {duration && ` · ${duration}`}
      </div>
      <div className="pt-1">
        <button
          type="button"
          disabled={splitting}
          onClick={onSplit}
          className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {splitting ? "Splitting…" : "Split"}
        </button>
      </div>
    </div>
  );
}
