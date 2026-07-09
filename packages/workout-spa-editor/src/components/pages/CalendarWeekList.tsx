/** Vertical list view for the calendar week — one section per day. */

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { DayWellness } from "../../types/health/day-wellness";
import { CalendarWeekListDay } from "./CalendarWeekListDay";

export type CalendarWeekListProps = {
  days: string[];
  matchedByDay?: Record<string, MatchedSessionWithMetadata[]>;
  soloPlansByDay?: Record<string, CoachingActivity[]>;
  soloActualsByDay?: Record<string, WorkoutRecord[]>;
  todayDate: string;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onAddClick: (date: string) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
  wellnessByDay?: Record<string, DayWellness>;
};

export function CalendarWeekList({
  days,
  matchedByDay = {},
  soloPlansByDay = {},
  soloActualsByDay = {},
  todayDate,
  onWorkoutClick,
  onAddClick,
  onActivityClick,
  wellnessByDay,
}: CalendarWeekListProps) {
  return (
    <div data-testid="calendar-week-list" className="flex flex-col gap-3">
      {days.map((date) => (
        <CalendarWeekListDay
          key={date}
          date={date}
          matched={matchedByDay[date] ?? []}
          plans={soloPlansByDay[date] ?? []}
          actuals={soloActualsByDay[date] ?? []}
          isToday={date === todayDate}
          wellness={wellnessByDay?.[date]}
          wellnessResolved={wellnessByDay !== undefined}
          onWorkoutClick={onWorkoutClick}
          onAddClick={onAddClick}
          onActivityClick={onActivityClick}
        />
      ))}
    </div>
  );
}
