/**
 * Calendar Hooks
 *
 * useLiveQuery for workouts + hydration status + week resolution.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { useParams } from "wouter";

import { db } from "../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  getCurrentWeekId,
  getWeekDays,
  parseWeekId,
} from "../../utils/week-utils";
import { countRawWorkouts, groupWorkoutsByDay } from "./calendar-utils";

export type HydrationStatus = "pending" | "complete" | "failed";

export type CalendarData = {
  weekId: string;
  isValidWeek: boolean;
  days: string[];
  workoutsByDay: Record<string, WorkoutRecord[]>;
  hydration: HydrationStatus;
  totalWorkoutCount: number | undefined;
  rawCount: number;
};

export function useCalendarData(): CalendarData {
  const params = useParams<{ weekId?: string }>();
  const [hydration, setHydration] = useState<HydrationStatus>("pending");

  const resolvedWeekId = useMemo(() => {
    if (!params.weekId) return getCurrentWeekId();
    return parseWeekId(params.weekId) ? params.weekId : null;
  }, [params.weekId]);

  const weekId = resolvedWeekId ?? getCurrentWeekId();
  const isValidWeek = resolvedWeekId !== null;
  const days = useMemo(() => getWeekDays(weekId), [weekId]);
  const range = useMemo(() => parseWeekId(weekId), [weekId]);

  const workouts = useLiveQuery(async (): Promise<WorkoutRecord[]> => {
    if (!range) return [];
    try {
      const result = await db
        .table<WorkoutRecord>("workouts")
        .where("date")
        .between(range.start, range.end, true, true)
        .toArray();
      setHydration("complete");
      return result;
    } catch {
      setHydration("failed");
      return [];
    }
  }, [range?.start, range?.end]);

  const totalWorkoutCount = useLiveQuery(
    () => db.table("workouts").count(),
    []
  );

  const workoutsByDay = useMemo(
    () => groupWorkoutsByDay(workouts, days),
    [workouts, days]
  );

  return {
    weekId,
    isValidWeek,
    days,
    workoutsByDay,
    hydration: workouts === undefined ? "pending" : hydration,
    totalWorkoutCount,
    rawCount: countRawWorkouts(workouts),
  };
}
