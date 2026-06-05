/**
 * Hook for the inline Template schedule flow.
 *
 * Given a `?date=` from the URL, on template click this hook fires
 * `scheduleTemplate` with that date and navigates back to the
 * calendar on success. Consumed by `useLibrarySchedule`.
 */

import { useLocation } from "wouter";

import { scheduleTemplate } from "../../application/library/schedule-template";
import { usePersistence } from "../../contexts/persistence-context";
import { useToastContext } from "../../contexts/ToastContext";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { calendarWeekHref } from "../../routing/calendar-week-href";

const TOAST_SCHEDULE_OK_TITLE = "Workout scheduled";
const TOAST_SCHEDULE_OK_DESC = "Added to your calendar.";
const TOAST_SCHEDULE_FAIL_TITLE = "Schedule failed";
const TOAST_SCHEDULE_FAIL_DESC = "Could not add the workout — please retry.";
const TOAST_NO_PROFILE_TITLE = "No active profile";
const TOAST_NO_PROFILE_DESC =
  "Open the profile manager to select or create one.";

export type PickerScheduleResult = "ok" | "no-profile" | "failed";

export function usePickerSchedule(date: string | null) {
  const [, navigate] = useLocation();
  const persistence = usePersistence();
  const toast = useToastContext();
  const profileId = useActiveProfileLive()?.id ?? null;

  return async (templateId: string): Promise<PickerScheduleResult> => {
    if (!date) return "failed";
    if (!profileId) {
      toast.error(TOAST_NO_PROFILE_TITLE, TOAST_NO_PROFILE_DESC);
      return "no-profile";
    }
    try {
      await scheduleTemplate(persistence, { templateId, date, profileId });
      toast.success(TOAST_SCHEDULE_OK_TITLE, TOAST_SCHEDULE_OK_DESC);
      // Land on the SCHEDULED week's grid so the new card is visible.
      navigate(calendarWeekHref(date));
      return "ok";
    } catch {
      toast.error(TOAST_SCHEDULE_FAIL_TITLE, TOAST_SCHEDULE_FAIL_DESC);
      return "failed";
    }
  };
}
