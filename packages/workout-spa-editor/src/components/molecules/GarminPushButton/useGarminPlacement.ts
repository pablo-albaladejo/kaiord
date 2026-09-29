import { useCallback, useState } from "react";

import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import type { GarminPlacementNotice } from "../../../hooks/use-garmin-placement-notice";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { useGarminPlacementActions } from "./useGarminPlacementActions";
import { useGarminPush } from "./useGarminPush";

const withoutDate = (
  dates: string[],
  date: string | undefined
): PlacementResult | undefined => {
  const at = date === undefined ? -1 : dates.indexOf(date);
  const rest = dates.filter((_, i) => i !== at);
  return rest.length > 0 ? { kind: "duplicate-left", dates: rest } : undefined;
};

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
      const entry = notice.removable.find(
        (e) => e.workoutScheduleId === workoutScheduleId
      );
      const done = await actions.dismiss(workoutScheduleId);
      // The warning keeps the dates still left behind; none left clears it.
      if (done && result?.kind === "duplicate-left")
        setLastRun(withoutDate(result.dates, entry?.date));
    },
    [actions, notice.removable, result, setLastRun]
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
