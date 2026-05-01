/**
 * CalendarPage - Week-view calendar with workout cards.
 *
 * Coaching data flows through the generic CoachingSource registry —
 * this file has zero platform-specific imports.
 */

import { useState } from "react";
import { Redirect } from "wouter";

import { useCoachingActivities } from "../../hooks/use-coaching-activities";
import { useCoachingAutoSync } from "../../hooks/use-coaching-auto-sync";
import type { CoachingActivity } from "../../types/coaching-activity";
import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { useCalendarState } from "./use-calendar-state";

export default function CalendarPage() {
  const s = useCalendarState();
  const coaching = useCoachingActivities(s.data.days);
  useCoachingAutoSync(coaching.syncSources, s.data.days[0]);
  const [selectedActivity, setSelectedActivity] =
    useState<CoachingActivity | null>(null);

  const handleActivityClick = (activity: CoachingActivity) => {
    setSelectedActivity(activity);
    coaching.expandActivity(activity);
  };

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
        onActivityClick={handleActivityClick}
      />
      <CalendarDialogs
        selectedWorkout={s.selectedWorkout}
        emptyDayDate={s.emptyDayDate}
        selectedCoachingActivity={selectedActivity}
        onCloseWorkout={() => s.setSelectedWorkout(null)}
        onCloseDay={() => s.setEmptyDayDate(null)}
        onCloseCoaching={() => setSelectedActivity(null)}
        expandActivity={coaching.expandActivity}
      />
    </div>
  );
}
