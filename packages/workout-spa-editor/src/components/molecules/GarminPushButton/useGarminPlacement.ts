import { useCallback, useState } from "react";

import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { GarminRemovalEntry } from "../../../types/garmin-removal-entry";
import { useGarminPlacementActions } from "./useGarminPlacementActions";
import { useGarminPush } from "./useGarminPush";

/**
 * The editor's send control state: the last placement result, the entries
 * the athlete may dismiss, and the actions that answer an `uncertain`.
 */
export const useGarminPlacement = (
  workout: WorkoutRecord | undefined,
  onSent?: (garminWorkoutId: string) => void
) => {
  const { push } = useGarminPush(workout, onSent);
  const actions = useGarminPlacementActions(workout?.id);
  const [result, setResult] = useState<PlacementResult>();
  const [removable, setRemovable] = useState<GarminRemovalEntry[]>([]);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (action: () => Promise<PlacementResult | undefined>) => {
      setBusy(true);
      try {
        const next = await action();
        setResult(next);
        setRemovable(next ? await actions.dismissable() : []);
      } finally {
        setBusy(false);
      }
    },
    [actions]
  );

  const dismiss = useCallback(
    async (workoutScheduleId: string) => {
      await actions.dismiss(workoutScheduleId);
      setRemovable(await actions.dismissable());
    },
    [actions]
  );

  return {
    result,
    removable,
    busy,
    send: () => run(() => push()),
    sendAnyway: () => run(() => push({ sendAnyway: true })),
    confirm: () => run(actions.confirm),
    dismiss,
  };
};
