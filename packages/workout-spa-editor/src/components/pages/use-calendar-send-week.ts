/**
 * "Send week" for the visible week: offered only with an enabled Garmin
 * export route and at least one persisted workout (projected executions
 * have no record to send). Closes the panel when the week changes.
 */
import { useEffect, useMemo } from "react";

import { isProjectedWorkoutRecord } from "../../application/coaching/activity-to-workout-record";
import { selectWeekPushCandidates } from "../../application/garmin-bulk/select-week-push-candidates";
import { useAnalytics, useGarminBridge } from "../../contexts";
import { usePersistence } from "../../contexts/persistence-context";
import { useSendWeek } from "../../hooks/send-week/use-send-week";
import { useGarminExportRoute } from "../../hooks/use-garmin-export-route";
import type { WorkoutRecord } from "../../types/calendar-record";

export function useCalendarSendWeek(
  profileId: string | null,
  weekId: string,
  workoutsByDay: Record<string, WorkoutRecord[]>
) {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const { extensionInstalled, sessionActive, features } = useGarminBridge();
  const routeActive = useGarminExportRoute(profileId) === true;
  const ctx = useMemo(
    () => ({
      persistence,
      analytics,
      features,
      routeActive,
      bridgeInstalled: extensionInstalled,
      sessionActive,
    }),
    [
      persistence,
      analytics,
      features,
      routeActive,
      extensionInstalled,
      sessionActive,
    ]
  );
  const send = useSendWeek(ctx);
  const workouts = useMemo(
    () =>
      Object.values(workoutsByDay)
        .flat()
        .filter((w) => !isProjectedWorkoutRecord(w)),
    [workoutsByDay]
  );
  const { close } = send;
  useEffect(() => close(), [weekId, close]);
  return {
    ...send,
    features,
    offered: routeActive && workouts.length > 0,
    startWeek: () => send.start(selectWeekPushCandidates(workouts)),
  };
}
