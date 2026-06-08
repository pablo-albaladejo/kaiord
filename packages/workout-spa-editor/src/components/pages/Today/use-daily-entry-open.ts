/**
 * Opening Planned entries in place on the Daily page: a coaching activity opens
 * its dialog; a ready/structured workout opens the editor (origin "daily"); a
 * raw/skipped workout opens the raw-workout dialog. The "Process" target carries
 * the daily origin so Back returns to /daily?date= (no calendar-origin leak).
 */
import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { withOrigin } from "../../../routing/with-origin";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { useSelectedActivity } from "../use-selected-activity";

export function useDailyEntryOpen(
  coachingByDay: Record<string, CoachingActivity[]>,
  focusIso: string,
  realTodayIso: string
) {
  const [, navigate] = useLocation();
  const { selectedActivity, setSelectedActivity } =
    useSelectedActivity(coachingByDay);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecord | null>(
    null
  );

  const workoutHref = useCallback(
    (id: string) =>
      withOrigin(`/workout/${id}`, "daily", {
        date: focusIso === realTodayIso ? undefined : focusIso,
      }),
    [focusIso, realTodayIso]
  );

  const handleWorkoutClick = useCallback(
    (workout: WorkoutRecord) => {
      if (workout.state === "raw" || workout.state === "skipped") {
        setSelectedWorkout(workout);
      } else {
        navigate(workoutHref(workout.id));
      }
    },
    [navigate, workoutHref]
  );

  const handleActivityClick = useCallback(
    (activity: CoachingActivity) => setSelectedActivity(activity),
    [setSelectedActivity]
  );

  return {
    handleWorkoutClick,
    handleActivityClick,
    selectedWorkout,
    selectedActivity,
    closeWorkout: useCallback(() => setSelectedWorkout(null), []),
    closeActivity: useCallback(
      () => setSelectedActivity(null),
      [setSelectedActivity]
    ),
    buildProcessHref: workoutHref,
  };
}
