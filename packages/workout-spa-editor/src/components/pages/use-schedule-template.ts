/**
 * Schedule Template Hook
 *
 * Creates a workout record from a template on a given date.
 */

import { useCallback, useState } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import { useToastContext } from "../../contexts/ToastContext";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { WorkoutTemplate } from "../../types/workout-library";

const TOAST_NO_PROFILE_TITLE = "No active profile";
const TOAST_NO_PROFILE_DESC =
  "Open the profile manager to select or create one.";

function createWorkoutFromTemplate(
  template: WorkoutTemplate,
  date: string,
  profileId: string
): WorkoutRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    profileId,
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
  const profileId = useActiveProfileLive()?.id ?? null;
  const toast = useToastContext();

  const openScheduler = useCallback((template: WorkoutTemplate) => {
    setScheduling(template);
  }, []);

  const closeScheduler = useCallback(() => {
    setScheduling(null);
  }, []);

  const confirmSchedule = useCallback(
    async (date: string) => {
      if (!scheduling) return;
      if (!profileId) {
        toast.error(TOAST_NO_PROFILE_TITLE, TOAST_NO_PROFILE_DESC);
        return;
      }
      const record = createWorkoutFromTemplate(scheduling, date, profileId);
      await db.table("workouts").put(record);
      setScheduling(null);
    },
    [scheduling, profileId, toast]
  );

  return { scheduling, openScheduler, closeScheduler, confirmSchedule };
}
