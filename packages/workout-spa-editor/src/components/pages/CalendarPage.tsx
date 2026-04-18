/**
 * CalendarPage - Week-view calendar with workout cards.
 *
 * Coaching data flows through the generic CoachingSource registry —
 * this file has zero platform-specific imports.
 */

import { Redirect } from "wouter";

import { useCoachingActivities } from "../../hooks/use-coaching-activities";
import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { useCalendarState } from "./use-calendar-state";

export default function CalendarPage() {
  const s = useCalendarState();
  const coaching = useCoachingActivities(s.data.days);

  if (!s.data.isValidWeek) return <Redirect to="/calendar" />;
  if (s.data.hydration === "pending") return <CalendarSkeleton />;

  return (
    <div className="space-y-4" data-testid="calendar-page">
      <CalendarHeader state={s} coaching={coaching} />
      <CalendarWeekGrid
        days={s.data.days}
        workoutsByDay={s.data.workoutsByDay}
        coachingByDay={coaching.byDay}
        todayDate={new Date().toISOString().slice(0, 10)}
        onWorkoutClick={s.handleWorkoutClick}
        onEmptyDayClick={s.setEmptyDayDate}
        onActivityExpand={coaching.expandActivity}
      />
      <CalendarDialogs
        selectedWorkout={s.selectedWorkout}
        emptyDayDate={s.emptyDayDate}
        onCloseWorkout={() => s.setSelectedWorkout(null)}
        onCloseDay={() => s.setEmptyDayDate(null)}
      />
    </div>
  );
}
