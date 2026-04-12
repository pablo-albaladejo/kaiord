/**
 * CalendarPage - Week-view calendar with workout cards.
 *
 * Single useLiveQuery at page level, passes data down as props.
 */

import { Redirect } from "wouter";

import { BatchProcessingBanner } from "../molecules/BatchProcessingBanner/BatchProcessingBanner";
import {
  EmptyWeekState,
  FirstVisitState,
  NoAiProviderState,
  NoBridgesState,
} from "../molecules/CalendarEmptyStates";
import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { WeekNavigation } from "../molecules/WorkoutCard/WeekNavigation";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { useCalendarState } from "./use-calendar-state";

export default function CalendarPage() {
  const s = useCalendarState();

  if (!s.data.isValidWeek) return <Redirect to="/calendar" />;
  if (s.data.hydration === "pending") return <CalendarSkeleton />;

  return (
    <div className="space-y-4" data-testid="calendar-page">
      {!s.hasAnyWorkouts && <FirstVisitState />}
      {s.hasAnyWorkouts && !s.hasWeekWorkouts && (
        <EmptyWeekState
          onGoToLatest={s.latestWorkout ? s.handleGoToLatest : undefined}
        />
      )}
      {s.data.rawCount > 0 && !s.hasAiProvider && <NoAiProviderState />}
      {s.hasReadyWorkouts && !s.extensionInstalled && <NoBridgesState />}
      <WeekNavigation
        weekId={s.data.weekId}
        weekLabel={s.data.weekId.replace("-W", " W")}
      />
      {s.batch.message && (
        <BatchMessage
          message={s.batch.message}
          onDismiss={s.batch.dismissMessage}
        />
      )}
      <BatchProcessingBanner
        rawCount={s.data.rawCount}
        isProcessing={s.batch.isProcessing}
        progress={s.batch.progress}
        onProcess={s.batch.start}
        onCancel={s.batch.cancel}
      />
      <CalendarWeekGrid
        days={s.data.days}
        workoutsByDay={s.data.workoutsByDay}
        todayDate={new Date().toISOString().slice(0, 10)}
        onWorkoutClick={s.handleWorkoutClick}
        onEmptyDayClick={s.setEmptyDayDate}
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

function BatchMessage({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} className="text-xs underline">
        Dismiss
      </button>
    </div>
  );
}
