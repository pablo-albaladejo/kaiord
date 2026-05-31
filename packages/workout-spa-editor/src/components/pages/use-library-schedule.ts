/**
 * Picks the LibraryPage schedule handler based on the URL.
 *
 * When entered with `?source=template-picker&date=YYYY-MM-DD`, returns
 * a handler that dispatches `scheduleTemplate` directly with the URL's
 * date and navigates to the calendar (via `usePickerSchedule`). Other
 * URLs return `openScheduler`, which opens the explicit
 * `ScheduleDateDialog`. Caller wires the chosen handler into the Library
 * list's `onSchedule` prop.
 */

import type { WorkoutTemplate } from "../../types/workout-library";
import { useLibraryShortCircuitDate } from "./use-library-short-circuit";
import { usePickerSchedule } from "./use-picker-schedule";

export function useLibrarySchedule(
  openScheduler: (template: WorkoutTemplate) => void
): (template: WorkoutTemplate) => void {
  const shortCircuitDate = useLibraryShortCircuitDate();
  const scheduleForUrlDate = usePickerSchedule(shortCircuitDate);
  return (template) => {
    if (shortCircuitDate) {
      void scheduleForUrlDate(template.id);
      return;
    }
    openScheduler(template);
  };
}
