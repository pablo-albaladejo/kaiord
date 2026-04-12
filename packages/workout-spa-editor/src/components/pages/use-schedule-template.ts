/**
 * Schedule Template Hook
 *
 * Creates a workout record from a template on a given date.
 */

import { useCallback, useState } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { WorkoutTemplate } from "../../types/workout-library";

function createWorkoutFromTemplate(
  template: WorkoutTemplate,
  date: string
): WorkoutRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    date,
    sport: template.sport,
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "structured",
    raw: null,
    krd: template.krd,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [...template.tags],
    previousState: null,
    createdAt: now,
    modifiedAt: null,
    updatedAt: now,
  };
}

export function useScheduleTemplate() {
  const [scheduling, setScheduling] = useState<WorkoutTemplate | null>(null);

  const openScheduler = useCallback((template: WorkoutTemplate) => {
    setScheduling(template);
  }, []);

  const closeScheduler = useCallback(() => {
    setScheduling(null);
  }, []);

  const confirmSchedule = useCallback(
    async (date: string) => {
      if (!scheduling) return;
      const record = createWorkoutFromTemplate(scheduling, date);
      await db.table("workouts").put(record);
      setScheduling(null);
    },
    [scheduling]
  );

  return { scheduling, openScheduler, closeScheduler, confirmSchedule };
}
