import type { PointerEvent } from "react";

import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CalendarView } from "../../../types/user-preferences";
import { renderDayCards } from "./day-column-cards";
import { getDayLabel } from "./day-label";

export type DayColumnProps = {
  date: string;
  isToday: boolean;
  view?: CalendarView;
  matchedSessions?: MatchedSessionWithMetadata[];
  soloPlans?: CoachingActivity[];
  soloActuals?: WorkoutRecord[];
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onEmptyDayClick: (date: string) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
  workoutCardPointerDownFor?: (
    workoutId: string
  ) => (event: PointerEvent) => void;
  dropTargetActive?: boolean;
};

const TODAY_BODY_TINT = "bg-primary-50/40 dark:bg-primary-900/20";
const DROP_RING = "ring-2 ring-primary-500 ring-offset-1";

export function DayColumn({
  date,
  isToday,
  view = "grid",
  matchedSessions = [],
  soloPlans = [],
  soloActuals = [],
  onWorkoutClick,
  onEmptyDayClick,
  onActivityClick,
  workoutCardPointerDownFor,
  dropTargetActive = false,
}: DayColumnProps) {
  const label = getDayLabel(date);
  const total = matchedSessions.length + soloPlans.length + soloActuals.length;
  const tint = isToday ? TODAY_BODY_TINT : "";
  const dropRing = dropTargetActive ? DROP_RING : "";
  return (
    <div
      data-testid={`day-column-${date}`}
      data-day={date}
      data-today={isToday ? "true" : undefined}
      data-drop-target={dropTargetActive ? "true" : undefined}
      aria-current={isToday ? "date" : undefined}
      role="group"
      className={`flex min-h-[120px] min-w-[140px] flex-1 flex-col rounded-lg border p-2 sm:min-w-0 ${tint} ${dropRing}`}
    >
      <div className="flex flex-1 flex-col gap-1.5">
        {renderDayCards({
          matchedSessions,
          soloPlans,
          soloActuals,
          view,
          onWorkoutClick,
          onActivityClick,
          workoutCardPointerDownFor,
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
