/**
 * useCoachingActivities — Aggregates all coaching platform data.
 *
 * Returns CoachingActivity[] grouped by date + expand handler.
 * Platform-agnostic: calendar components never import platform stores.
 * New platforms (TrainingPeaks, etc.) are added here only.
 */

import { useCallback, useMemo } from "react";

import { toCoachingActivity } from "../adapters/train2go/train2go-mapper";
import { useTrain2GoStore } from "../store/train2go-store";
import type { CoachingActivity } from "../types/coaching-activity";

export function useCoachingActivities(days: string[]) {
  const t2gActivities = useTrain2GoStore((s) => s.activities);
  const t2gFetchDay = useTrain2GoStore((s) => s.fetchDay);

  const byDay = useMemo(() => {
    const all = t2gActivities.map(toCoachingActivity);

    const grouped: Record<string, CoachingActivity[]> = {};
    for (const day of days) {
      grouped[day] = all.filter((a) => a.date === day);
    }
    return grouped;
  }, [t2gActivities, days]);

  const expandActivity = useCallback(
    (activity: CoachingActivity) => {
      if (activity.source === "train2go" && activity.date) {
        t2gFetchDay(activity.date);
      }
      // Future: handle other sources
    },
    [t2gFetchDay]
  );

  return { byDay, expandActivity };
}
