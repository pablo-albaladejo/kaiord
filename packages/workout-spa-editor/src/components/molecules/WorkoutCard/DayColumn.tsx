/**
 * Renders three buckets in order: matched sessions, then solo coaching
 * plans, then solo executed workouts. Today is signalled via a pill on
 * the day-name label (NOT a column-wide tint), and the column carries
 * `aria-current="date"` so assistive tech can locate it without
 * relying on the visible pill. The empty-day affordance is permanently
 * visible (rather than hover-only) so first-time and keyboard-first
 * users discover it without hover state.
 */

import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CalendarDensity } from "../../../types/user-preferences";
import { renderDayCards } from "./day-column-cards";

export type DayColumnProps = {
  date: string;
  isToday: boolean;
  density?: CalendarDensity;
  matchedSessions?: MatchedSessionWithMetadata[];
  soloPlans?: CoachingActivity[];
  soloActuals?: WorkoutRecord[];
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onEmptyDayClick: (date: string) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getDayLabel = (date: string): { name: string; num: number } => {
  const d = new Date(date + "T12:00:00Z");
  return {
    name: DAY_NAMES[(d.getUTCDay() + 6) % 7] ?? "",
    num: d.getUTCDate(),
  };
};

const TODAY_PILL =
  "rounded-full bg-primary-100 px-1.5 text-primary-900 dark:bg-primary-900 dark:text-primary-100";

export function DayColumn({
  date,
  isToday,
  density = "compact",
  matchedSessions = [],
  soloPlans = [],
  soloActuals = [],
  onWorkoutClick,
  onEmptyDayClick,
  onActivityClick,
}: DayColumnProps) {
  const label = getDayLabel(date);
  const total = matchedSessions.length + soloPlans.length + soloActuals.length;

  return (
    <div
      data-testid={`day-column-${date}`}
      aria-current={isToday ? "date" : undefined}
      role="group"
      className="flex min-h-[120px] min-w-[140px] flex-1 flex-col rounded-lg border p-2 sm:min-w-0"
    >
      <span className="mb-2 text-xs font-semibold text-muted-foreground">
        <span className={isToday ? TODAY_PILL : ""}>
          {label.name} {label.num}
        </span>
        {isToday && <span className="sr-only"> (today)</span>}
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        {renderDayCards({
          matchedSessions,
          soloPlans,
          soloActuals,
          density,
          onWorkoutClick,
          onActivityClick,
        })}
      </div>
      {total === 0 && (
        <button
          type="button"
          data-testid={`empty-day-${date}`}
          aria-label={`Add to ${label.name} ${label.num}`}
          className="mt-1 flex-1 rounded border border-dashed border-gray-300 text-xs text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-gray-600"
          onClick={() => onEmptyDayClick(date)}
        >
          + Add
        </button>
      )}
    </div>
  );
}
