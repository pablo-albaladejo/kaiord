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
import { useTranslate } from "../../i18n/use-translate";
import { calendarWeekHref } from "../../routing/calendar-week-href";

export type PickerScheduleResult = "ok" | "no-profile" | "failed";

export function usePickerSchedule(date: string | null) {
  const [, navigate] = useLocation();
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("library");
  const profileId = useActiveProfileLive()?.id ?? null;

  return async (templateId: string): Promise<PickerScheduleResult> => {
    if (!date) return "failed";
    if (!profileId) {
      toast.error(
        t("scheduleDialog.noAthlete"),
        t("scheduleDialog.noAthleteDescription")
      );
      return "no-profile";
    }
    try {
      await scheduleTemplate(persistence, { templateId, date, profileId });
      toast.success(
        t("scheduleDialog.scheduled"),
        t("scheduleDialog.scheduledDescription")
      );
      // Land on the SCHEDULED week's grid so the new card is visible.
      navigate(calendarWeekHref(date));
      return "ok";
    } catch {
      toast.error(
        t("scheduleDialog.failed"),
        t("scheduleDialog.failedDescription")
      );
      return "failed";
    }
  };
}
