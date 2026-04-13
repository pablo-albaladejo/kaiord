/**
 * Calendar page state - aggregates queries and handlers.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { db } from "../../adapters/dexie/dexie-database";
import { useGarminBridge } from "../../contexts";
import type { WorkoutRecord } from "../../types/calendar-record";
import { getWeekIdForDate } from "../../utils/week-utils";
import { useCalendarData } from "./calendar-hooks";
import { useBatchState } from "./use-batch-state";

export function useCalendarState() {
  const data = useCalendarData();
  const [, navigate] = useLocation();
  const { extensionInstalled } = useGarminBridge();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecord | null>(
    null
  );
  const [emptyDayDate, setEmptyDayDate] = useState<string | null>(null);
  const batch = useBatchState(data.weekStart, data.weekEnd);

  const latestWorkout = useLiveQuery(
    () => db.table<WorkoutRecord>("workouts").orderBy("date").last(),
    []
  );

  const aiProviderCount = useLiveQuery(
    () => db.table("aiProviders").count(),
    []
  );

  const handleGoToLatest = useCallback(() => {
    if (latestWorkout?.date) {
      const d = new Date(latestWorkout.date + "T12:00:00Z");
      navigate(`/calendar/${getWeekIdForDate(d)}`);
    }
  }, [latestWorkout, navigate]);

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

  const hasAnyWorkouts = (data.totalWorkoutCount ?? 0) > 0;
  const hasWeekWorkouts = Object.values(data.workoutsByDay).some(
    (w) => w.length > 0
  );
  const hasReadyWorkouts = Object.values(data.workoutsByDay).some((ws) =>
    ws.some((w) => w.state === "ready")
  );

  return {
    data,
    batch,
    selectedWorkout,
    emptyDayDate,
    latestWorkout,
    extensionInstalled,
    hasAiProvider: (aiProviderCount ?? 0) > 0,
    hasAnyWorkouts,
    hasWeekWorkouts,
    hasReadyWorkouts,
    handleGoToLatest,
    handleWorkoutClick,
    setSelectedWorkout,
    setEmptyDayDate,
  };
}
