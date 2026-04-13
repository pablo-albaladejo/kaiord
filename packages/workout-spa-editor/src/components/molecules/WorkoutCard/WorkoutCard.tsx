/**
 * WorkoutCard - Compact card for calendar day columns.
 *
 * Displays sport, title, duration/distance, source, and state indicator.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import { formatDuration, getStateIndicator } from "./workout-card-utils";

export type WorkoutCardProps = {
  workout: WorkoutRecord;
  onClick: (workout: WorkoutRecord) => void;
};

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const indicator = getStateIndicator(workout.state);
  const title = workout.raw?.title ?? workout.sport;
  const duration = workout.raw?.duration;

  return (
    <button
      type="button"
      data-testid={`workout-card-${workout.id}`}
      className="w-full rounded-md border bg-white p-2 text-left text-sm shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
      onClick={() => onClick(workout)}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={indicator.className}
          title={indicator.label}
          data-testid="state-indicator"
        >
          {indicator.symbol}
        </span>
        <span className="truncate font-medium">{title}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{workout.sport}</span>
        {duration && <span>{formatDuration(duration.value)}</span>}
        <span className="ml-auto text-xs opacity-60">{workout.source}</span>
      </div>
    </button>
  );
}
