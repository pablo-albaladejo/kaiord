/**
 * Memoized `buildCalendarBuckets` for `useCalendarPage`. Extracted so
 * the entry hook stays under the per-file line cap.
 */

import { useMemo } from "react";

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { CalendarBuckets } from "./calendar-buckets";
import { buildCalendarBuckets } from "./calendar-buckets";

export type UseCalendarBucketsArgs = {
  days: string[];
  workoutsByDay: Record<string, WorkoutRecord[]>;
  coachingByDay: Record<string, CoachingActivity[]>;
  activitiesByDay: Record<string, ActivityRecord[]>;
  matched: MatchedSessionWithMetadata[];
};

export const useCalendarBucketsMemo = ({
  days,
  workoutsByDay,
  coachingByDay,
  activitiesByDay,
  matched,
}: UseCalendarBucketsArgs): CalendarBuckets =>
  useMemo(
    () =>
      buildCalendarBuckets({
        days,
        workoutsByDay,
        coachingByDay,
        activitiesByDay,
        matched,
      }),
    [days, workoutsByDay, coachingByDay, activitiesByDay, matched]
  );
