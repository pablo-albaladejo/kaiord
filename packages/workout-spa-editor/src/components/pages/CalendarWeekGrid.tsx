/**
 * CalendarWeekGrid - 7-column grid of day columns.
 */

import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import { DayColumn } from "../molecules/WorkoutCard/DayColumn";

export type CalendarWeekGridProps = {
  days: string[];
  workoutsByDay: Record<string, WorkoutRecord[]>;
  coachingByDay?: Record<string, CoachingActivity[]>;
  todayDate: string;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onEmptyDayClick: (date: string) => void;
  onActivityExpand?: (activity: CoachingActivity) => void;
};

export function CalendarWeekGrid({
  days,
  workoutsByDay,
  coachingByDay = {},
  todayDate,
  onWorkoutClick,
  onEmptyDayClick,
  onActivityExpand,
}: CalendarWeekGridProps) {
  return (
    <div
      data-testid="calendar-week-grid"
      className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:overflow-x-visible sm:pb-0"
    >
      {days.map((date) => (
        <DayColumn
          key={date}
          date={date}
          isToday={date === todayDate}
          workouts={workoutsByDay[date] ?? []}
          coachingActivities={coachingByDay[date]}
          onWorkoutClick={onWorkoutClick}
          onEmptyDayClick={onEmptyDayClick}
          onActivityExpand={onActivityExpand}
        />
      ))}
    </div>
  );
}
