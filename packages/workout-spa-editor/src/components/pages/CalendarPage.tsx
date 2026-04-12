/**
 * CalendarPage - Week-view calendar with workout cards.
 *
 * Single useLiveQuery at page level, passes data down as props.
 */

import { useCallback, useState } from "react";
import { Redirect, useLocation } from "wouter";

import type { WorkoutRecord } from "../../types/calendar-record";
import { BatchProcessingBanner } from "../molecules/BatchProcessingBanner/BatchProcessingBanner";
import {
  EmptyWeekState,
  FirstVisitState,
} from "../molecules/CalendarEmptyStates";
import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { WeekNavigation } from "../molecules/WorkoutCard/WeekNavigation";
import { useCalendarData } from "./calendar-hooks";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { useBatchState } from "./use-batch-state";

export default function CalendarPage() {
  const data = useCalendarData();
  const [, navigate] = useLocation();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecord | null>(
    null
  );
  const [emptyDayDate, setEmptyDayDate] = useState<string | null>(null);
  const batch = useBatchState(data.rawCount);

  if (!data.isValidWeek) return <Redirect to="/calendar" />;

  const handleWorkoutClick = useCallback(
    (workout: WorkoutRecord) => {
      if (workout.state === "raw" || workout.state === "skipped") {
        setSelectedWorkout(workout);
      } else {
        navigate(`/workout/${workout.id}`);
      }
    },
    [navigate]
  );

  if (data.hydration === "pending") return <CalendarSkeleton />;

  const hasAnyWorkouts = (data.totalWorkoutCount ?? 0) > 0;
  const hasWeekWorkouts = Object.values(data.workoutsByDay).some(
    (w) => w.length > 0
  );

  if (!hasAnyWorkouts) return <FirstVisitState />;

  return (
    <div className="space-y-4" data-testid="calendar-page">
      <WeekNavigation
        weekId={data.weekId}
        weekLabel={data.weekId.replace("-W", " W")}
      />
      <BatchProcessingBanner
        rawCount={data.rawCount}
        isProcessing={batch.isProcessing}
        progress={batch.progress}
        onProcess={batch.start}
        onCancel={batch.cancel}
      />
      {hasWeekWorkouts ? (
        <CalendarWeekGrid
          days={data.days}
          workoutsByDay={data.workoutsByDay}
          todayDate={new Date().toISOString().slice(0, 10)}
          onWorkoutClick={handleWorkoutClick}
          onEmptyDayClick={setEmptyDayDate}
        />
      ) : (
        <EmptyWeekState />
      )}
      <CalendarDialogs
        selectedWorkout={selectedWorkout}
        emptyDayDate={emptyDayDate}
        onCloseWorkout={() => setSelectedWorkout(null)}
        onCloseDay={() => setEmptyDayDate(null)}
      />
    </div>
  );
}
