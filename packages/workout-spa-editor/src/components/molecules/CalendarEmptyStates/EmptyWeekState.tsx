/**
 * EmptyWeekState - No workouts this week, but data exists elsewhere.
 */

import { Calendar, Plus } from "lucide-react";
import { useLocation } from "wouter";

export type EmptyWeekStateProps = {
  onGoToLatest?: () => void;
};

export function EmptyWeekState({ onGoToLatest }: EmptyWeekStateProps) {
  const [, navigate] = useLocation();

  return (
    <div
      data-testid="empty-week-state"
      className="flex flex-col items-center gap-4 py-12"
    >
      <Calendar className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground">No workouts this week</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate("/workout/new")}
          className="flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add workout
        </button>
        {onGoToLatest && (
          <button
            type="button"
            onClick={onGoToLatest}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Go to latest
          </button>
        )}
      </div>
    </div>
  );
}
