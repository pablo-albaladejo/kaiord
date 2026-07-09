import { useLocation } from "wouter";

import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { calendarWeekHref } from "../../../routing/calendar-week-href";
import { useCurrentWorkout } from "../../../store/selectors/workout-selectors";
import type { Workout } from "../../../types/krd";
import { isValidCalendarDate } from "../../../utils/is-valid-calendar-date";
import { persistScratchWorkout } from "./persist-scratch-workout";

const DEFAULT_SPORT = "cycling";

export type UsePersistScratch = {
  canSchedule: boolean;
  schedule: () => Promise<void>;
};

/**
 * Scratch-local "Save & schedule" wiring: persists `currentWorkout` onto
 * the target `date` as a new scratch WorkoutRecord, then lands on the
 * calendar week containing it so the new card is visible on arrival.
 * D6-rejects calendar-impossible dates (toast, no persist/nav).
 */
export function usePersistScratch(date: string): UsePersistScratch {
  const t = useTranslate("editor");
  const currentWorkout = useCurrentWorkout();
  const profileId = useActiveProfileLive()?.id ?? null;
  const persistence = usePersistence();
  const [, navigate] = useLocation();
  const toast = useToastContext();

  const canSchedule = profileId !== null && currentWorkout !== null;

  const schedule = async (): Promise<void> => {
    if (!currentWorkout || !profileId) return;
    if (!isValidCalendarDate(date)) {
      toast.error(t("scratch.invalidTitle"), t("scratch.invalidDescription"));
      return;
    }
    const workout = currentWorkout.extensions?.structured_workout as
      Workout | undefined;
    const sport = workout?.sport ?? DEFAULT_SPORT;
    try {
      await persistScratchWorkout(persistence, {
        krd: currentWorkout,
        date,
        profileId,
        sport,
      });
      navigate(calendarWeekHref(date));
    } catch {
      toast.error(
        t("scratch.saveFailedTitle"),
        t("scratch.saveFailedDescription")
      );
    }
  };

  return { canSchedule, schedule };
}
