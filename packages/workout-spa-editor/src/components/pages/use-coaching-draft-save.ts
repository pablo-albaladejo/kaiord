/**
 * useCoachingDraftSave — the single persist trigger for a store-only
 * coaching draft. Mirrors `usePersistScratch`: the explicit Save click
 * persists the CURRENT store KRD (carrying user edits) via
 * `persistCoachingWorkout`, then replaces the URL with the real
 * `/workout/:id` so a reload no longer re-derives the draft.
 */
import { useLocation } from "wouter";

import type { CoachingActivityForConvert } from "../../application/coaching/convert-coaching-activity-manual-types";
import { persistCoachingWorkout } from "../../application/coaching/persist-coaching-workout";
import { useAnalytics } from "../../contexts/analytics-context";
import { usePersistence } from "../../contexts/persistence-context";
import { useToastContext } from "../../contexts/ToastContext";
import { useTranslate } from "../../i18n/use-translate";
import { useCurrentWorkout } from "../../store/selectors/workout-selectors";

export type UseCoachingDraftSave = {
  canSave: boolean;
  save: () => Promise<void>;
};

export function useCoachingDraftSave(
  activity: CoachingActivityForConvert | undefined
): UseCoachingDraftSave {
  const currentWorkout = useCurrentWorkout();
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const toast = useToastContext();
  const t = useTranslate("editor");
  const [, navigate] = useLocation();

  const canSave = activity !== undefined && currentWorkout !== null;

  const save = async (): Promise<void> => {
    if (!activity || !currentWorkout) return;
    try {
      const result = await persistCoachingWorkout(
        { krd: currentWorkout, activity },
        {
          coaching: persistence.coaching,
          workouts: persistence.workouts,
          sessionMatches: persistence.sessionMatch,
          transaction: persistence.transaction,
          analytics,
          newWorkoutId: () => crypto.randomUUID(),
          newMatchId: () => crypto.randomUUID(),
          clock: () => new Date().toISOString(),
        }
      );
      navigate(`/workout/${result.workoutId}`, { replace: true });
    } catch {
      toast.error(
        t("scratch.saveFailedTitle"),
        t("scratch.draftSaveFailedDescription")
      );
    }
  };

  return { canSave, save };
}
