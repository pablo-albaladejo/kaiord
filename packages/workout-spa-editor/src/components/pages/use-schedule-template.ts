/**
 * Schedule Template Hook
 *
 * Creates a workout record from a template on a given date.
 */

import { useCallback, useState } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import { useToastContext } from "../../contexts/ToastContext";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { createStructuredWorkoutRecord } from "../../types/calendar-record";
import type { WorkoutTemplate } from "../../types/workout-library";

const TOAST_NO_PROFILE_TITLE = "No active profile";
const TOAST_NO_PROFILE_DESC =
  "Open the profile manager to select or create one.";

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
      const record = createStructuredWorkoutRecord({
        profileId,
        date,
        sport: scheduling.sport,
        source: "kaiord",
        krd: scheduling.krd,
        tags: scheduling.tags,
        raw: null,
      });
      await db.table("workouts").put(record);
      setScheduling(null);
    },
    [scheduling, profileId, toast]
  );

  return { scheduling, openScheduler, closeScheduler, confirmSchedule };
}
