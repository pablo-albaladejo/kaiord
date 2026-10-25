import { createElement, useCallback } from "react";

import { garminDateDrift } from "../../../application/garmin-placement/garmin-date-drift";
import { useToastContext } from "../../../contexts/ToastContext";
import { GARMIN_BRIDGE_ID, ledgerRepo } from "../../../hooks/garmin-push-fn";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import type { PersistencePort } from "../../../ports/persistence-port";
import { driftSentence } from "../../molecules/GarminDriftBadge/GarminDriftBadge";
import { UpdateGarminToastAction } from "./UpdateGarminToastAction";

/**
 * After a move: when Garmin still holds the workout on another day, a toast
 * names that day and offers Update Garmin (design §3.11). Nothing is pushed
 * until the athlete presses it. Resolves `true` iff the toast was shown, so a
 * caller with its own success toast shows one, not two.
 */
export function useGarminDriftToast(persistence: () => PersistencePort) {
  const t = useTranslate("calendar");
  const locale = useActiveLocale();
  const toast = useToastContext();

  return useCallback(
    async (workoutId: string): Promise<boolean> => {
      const workout = await persistence().workouts.getById(workoutId);
      if (!workout) return false;
      const row = await ledgerRepo.findByNaturalKey({
        kaiordRecordId: workoutId,
        destinationBridgeId: GARMIN_BRIDGE_ID,
      });
      // It just moved, so it is not locked.
      const drift = garminDateDrift(row, workout, { locked: false });
      if (!drift) return false;
      toast.warning(t("garminDrift.moved"), driftSentence(t, locale, drift), {
        action: createElement(UpdateGarminToastAction, { workoutId }),
      });
      return true;
    },
    [persistence, toast, t, locale]
  );
}
