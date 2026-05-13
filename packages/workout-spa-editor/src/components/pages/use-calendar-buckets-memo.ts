/**
 * Memoized `buildCalendarBuckets` for `useCalendarPage`. Extracted so
 * the entry hook stays under the per-file line cap.
 */

import { useMemo } from "react";

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import { buildCalendarBuckets, type CalendarBuckets } from "./calendar-buckets";

export type UseCalendarBucketsArgs = {
  days: string[];
  workoutsByDay: Record<string, WorkoutRecord[]>;
  coachingByDay: Record<string, CoachingActivity[]>;
  matched: MatchedSessionWithMetadata[];
};

export const useCalendarBucketsMemo = ({
  days,
  workoutsByDay,
  coachingByDay,
  matched,
}: UseCalendarBucketsArgs): CalendarBuckets =>
  useMemo(
    () => buildCalendarBuckets({ days, workoutsByDay, coachingByDay, matched }),
    [days, workoutsByDay, coachingByDay, matched]
  );
