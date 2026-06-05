/**
 * Calendar page state - aggregates queries and handlers.
 */

import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { useGarminBridge } from "../../contexts";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { withOrigin } from "../../routing/with-origin";
import type { WorkoutRecord } from "../../types/calendar-record";
import { getWeekIdForDate } from "../../utils/week-utils";
import { useCalendarData } from "./calendar-hooks";
import { useAddEntryChooser } from "./use-add-entry-chooser";
import { useBatchState } from "./use-batch-state";
import {
  useAiProviderCountLive,
  useLatestWorkoutLive,
} from "./use-calendar-live-queries";

export function useCalendarState() {
  const profileId = useActiveProfileLive()?.id ?? null;
  const data = useCalendarData(profileId);
  const [, navigate] = useLocation();
  const { extensionInstalled } = useGarminBridge();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecord | null>(
    null
  );
  const batch = useBatchState(data.weekStart, data.weekEnd);
  const latestWorkout = useLatestWorkoutLive(profileId);
  const aiProviderCount = useAiProviderCountLive();
  const addEntry = useAddEntryChooser();

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
        navigate(withOrigin(`/workout/${workout.id}`, "calendar"));
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
    latestWorkout,
    extensionInstalled,
    hasAiProvider: aiProviderCount > 0,
    hasAnyWorkouts,
    hasWeekWorkouts,
    hasReadyWorkouts,
    handleGoToLatest,
    handleWorkoutClick,
    setSelectedWorkout,
    ...addEntry,
  };
}
