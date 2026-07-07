/**
 * useCalendarExecuted — groups the calendar's executed-activity plumbing:
 * pull Garmin activities (governed), read the visible week's activities, and
 * auto-match them into existing sessions. Returns the by-day activities for
 * the bucket builder's native render. Extracted so `useCalendarPage` stays
 * under its line cap.
 */
import type { ActivityRecord } from "../types/activity-record";
import type { WorkoutRecord } from "../types/calendar-record";
import { useCalendarActivities } from "./use-calendar-activities";
import { useExecutedMatchAutoForCalendar } from "./use-executed-match-auto";
import { useGarminActivitiesPull } from "./use-garmin-activities-pull";
import type { MatchedSessionWithMetadata } from "./use-matched-sessions";

export type CalendarExecutedData = {
  days: string[];
  workoutsByDay: Readonly<Record<string, WorkoutRecord[]>>;
};

export const useCalendarExecuted = (
  profileId: string | null,
  rawMatched: readonly MatchedSessionWithMetadata[] | undefined,
  data: CalendarExecutedData
): Record<string, ActivityRecord[]> => {
  useGarminActivitiesPull(profileId);
  const { activities, byDay } = useCalendarActivities(profileId, data.days);
  useExecutedMatchAutoForCalendar(rawMatched, data.workoutsByDay, activities);
  return byDay;
};
