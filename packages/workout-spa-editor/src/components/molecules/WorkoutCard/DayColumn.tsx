/**
 * DayColumn - Single day in the calendar week view.
 *
 * Shows day header and stacked workout cards.
 * Clickable empty area triggers add-workout flow.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { CoachingActivityCard } from "../CoachingCard/CoachingActivityCard";
import { WorkoutCard } from "./WorkoutCard";

export type DayColumnProps = {
  date: string;
  isToday: boolean;
  workouts: WorkoutRecord[];
  coachingActivities?: CoachingActivity[];
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onEmptyDayClick: (date: string) => void;
  onActivityExpand?: (activity: CoachingActivity) => void;
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
  coachingActivities = [],
  onWorkoutClick,
  onEmptyDayClick,
  onActivityExpand,
}: DayColumnProps) {
  const label = getDayLabel(date);
  const todayClass = isToday ? "bg-primary-50 dark:bg-primary-950" : "";

  return (
    <div
      data-testid={`day-column-${date}`}
      className={`flex min-h-[120px] min-w-[120px] flex-1 flex-col rounded-lg border p-2 sm:min-w-0 ${todayClass}`}
    >
      <span className="mb-2 text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        {coachingActivities.map((a) => (
          <CoachingActivityCard
            key={a.id}
            activity={a}
            onExpand={onActivityExpand}
          />
        ))}
        {workouts.map((w) => (
          <WorkoutCard key={w.id} workout={w} onClick={onWorkoutClick} />
        ))}
      </div>
      {workouts.length === 0 && coachingActivities.length === 0 && (
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
