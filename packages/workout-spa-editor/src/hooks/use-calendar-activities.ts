/**
 * useCalendarActivities — live read of the v27 `activities` (executed
 * sessions) for the visible calendar week, grouped by day.
 *
 * Backs the calendar's native activity render (GATE A1): the flat list feeds
 * the executed-match auto hook and the by-day map feeds the bucket builder.
 * One `useLiveQuery` over the `[profileId+date]` index keeps the read budget
 * bounded, mirroring `useCoachingActivities`.
 */
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { usePersistence } from "../contexts/persistence-context";
import type { ActivityRecord } from "../types/activity-record";

export type CalendarActivities = {
  activities: ActivityRecord[];
  byDay: Record<string, ActivityRecord[]>;
};

export const useCalendarActivities = (
  profileId: string | null,
  days: string[]
): CalendarActivities => {
  const persistence = usePersistence();
  const start = days[0] ?? "";
  const end = days[days.length - 1] ?? "";
  const rows = useLiveQuery(() => {
    if (!profileId || !start || !end) return Promise.resolve([]);
    return persistence.activities.getByProfileAndDateRange(
      profileId,
      start,
      end
    );
  }, [profileId, start, end]);

  return useMemo(() => {
    const activities = rows ?? [];
    const byDay: Record<string, ActivityRecord[]> = {};
    for (const a of activities) (byDay[a.date] ??= []).push(a);
    return { activities, byDay };
  }, [rows]);
};
