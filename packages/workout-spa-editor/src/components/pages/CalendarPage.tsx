/**
 * CalendarPage - Week-view calendar with workout cards.
 *
 * Coaching data flows through the generic CoachingSource registry —
 * this file has zero platform-specific imports.
 */

import { Redirect } from "wouter";

import { useCoachingActivities } from "../../hooks/use-coaching-activities";
import { CoachingSyncButton } from "../molecules/CoachingCard/CoachingSyncButton";
import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { WeekNavigation } from "../molecules/WorkoutCard/WeekNavigation";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarEmptyBanners } from "./CalendarEmptyBanners";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { useCalendarState } from "./use-calendar-state";

export default function CalendarPage() {
  const s = useCalendarState();
  const coaching = useCoachingActivities(s.data.days);

  if (!s.data.isValidWeek) return <Redirect to="/calendar" />;
  if (s.data.hydration === "pending") return <CalendarSkeleton />;

  return (
    <div className="space-y-4" data-testid="calendar-page">
      <CalendarEmptyBanners
        hasAnyWorkouts={s.hasAnyWorkouts}
        hasWeekWorkouts={s.hasWeekWorkouts}
        hasReadyWorkouts={s.hasReadyWorkouts}
        hasAiProvider={s.hasAiProvider}
        extensionInstalled={s.extensionInstalled}
        rawCount={s.data.rawCount}
        onGoToLatest={s.latestWorkout ? s.handleGoToLatest : undefined}
        batchMessage={s.batch.message}
        onDismissBatch={s.batch.dismissMessage}
        batchIsProcessing={s.batch.isProcessing}
        batchProgress={s.batch.progress}
        onBatchProcess={s.batch.start}
        onBatchCancel={s.batch.cancel}
      />
      <div className="flex items-center justify-between">
        <WeekNavigation
          weekId={s.data.weekId}
          weekLabel={s.data.weekId.replace("-W", " W")}
        />
        <div className="flex gap-2">
          {coaching.syncSources.map((src) => (
            <CoachingSyncButton
              key={src.id}
              connected={src.connected}
              loading={src.loading}
              error={src.error}
              onSync={() => src.sync(s.data.days[0])}
              onConnect={src.connect}
              label={src.label}
            />
          ))}
        </div>
      </div>
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
