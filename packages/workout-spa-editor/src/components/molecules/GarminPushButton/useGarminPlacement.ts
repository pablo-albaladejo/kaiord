import { useCallback, useState } from "react";

import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import type { GarminPlacementNotice } from "../../../hooks/use-garmin-placement-notice";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { useGarminPlacementActions } from "./useGarminPlacementActions";
import { useGarminPush } from "./useGarminPush";

/**
 * The send control's actions on a record's placement notice: send, the
 * answers to an `uncertain`, and "I removed it". Each run's outcome goes
 * to the notice (it outlives this control); the ledger-derived parts
 * refresh through the notice's live query.
 */
export const useGarminPlacement = (
  workout: WorkoutRecord | undefined,
  notice: GarminPlacementNotice,
  onSent?: (garminWorkoutId: string) => void
) => {
  const { push } = useGarminPush(workout, onSent);
  const actions = useGarminPlacementActions(workout?.id);
  const [busy, setBusy] = useState(false);
  const { setLastRun, result } = notice;

  const run = useCallback(
    async (action: () => Promise<PlacementResult | undefined>) => {
      setBusy(true);
      try {
        const next = await action();
        if (next) setLastRun(next);
      } finally {
        setBusy(false);
      }
    },
    [setLastRun]
  );

  const dismiss = useCallback(
    async (workoutScheduleId: string) => {
      const done = await actions.dismiss(workoutScheduleId);
      // The left-behind warning is answered; the row decides what remains.
      if (done && result?.kind === "duplicate-left") setLastRun(undefined);
    },
    [actions, result, setLastRun]
  );

  return {
    result,
    removable: notice.removable,
    busy,
    send: () => run(() => push()),
    sendAnyway: () => run(() => push({ sendAnyway: true })),
    confirm: () => run(actions.confirm),
    dismiss,
  };
};
