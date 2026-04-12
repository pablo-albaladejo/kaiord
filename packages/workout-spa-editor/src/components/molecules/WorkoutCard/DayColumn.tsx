/**
 * DayColumn - Single day in the calendar week view.
 *
 * Shows day header and stacked workout cards.
 * Clickable empty area triggers add-workout flow.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import { WorkoutCard } from "./WorkoutCard";

export type DayColumnProps = {
  date: string;
  isToday: boolean;
  workouts: WorkoutRecord[];
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onEmptyDayClick: (date: string) => void;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDayLabel(date: string): string {
  const d = new Date(date + "T12:00:00Z");
  const dayIndex = (d.getUTCDay() + 6) % 7;
  const dayNum = d.getUTCDate();
  return `${DAY_NAMES[dayIndex]} ${dayNum}`;
}

export function DayColumn({
  date,
  isToday,
  workouts,
  onWorkoutClick,
  onEmptyDayClick,
}: DayColumnProps) {
  const label = getDayLabel(date);
  const todayClass = isToday ? "bg-primary-50 dark:bg-primary-950" : "";

  return (
    <div
      data-testid={`day-column-${date}`}
      className={`flex min-h-[120px] flex-col rounded-lg border p-2 ${todayClass}`}
    >
      <span className="mb-2 text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        {workouts.map((w) => (
          <WorkoutCard key={w.id} workout={w} onClick={onWorkoutClick} />
        ))}
      </div>
      {workouts.length === 0 && (
        <button
          type="button"
          data-testid={`empty-day-${date}`}
          className="flex-1 rounded border border-dashed border-gray-300 text-xs text-muted-foreground hover:border-primary-400 hover:text-primary-600 transition-colors dark:border-gray-600"
          onClick={() => onEmptyDayClick(date)}
        >
          +
        </button>
      )}
    </div>
  );
}
