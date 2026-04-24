import { useCallback } from "react";

import { useGarminBridge } from "../../../contexts";
import { useCurrentWorkout } from "../../../store/workout-store-selectors";
import { exportGcnWorkout } from "../../../utils/export-workout-formats";

export const useGarminPush = () => {
  const { pushWorkout, setPushing, sessionActive } = useGarminBridge();
  const currentWorkout = useCurrentWorkout();

  const push = useCallback(async () => {
    if (!currentWorkout || !sessionActive) return;

    try {
      const gcn = await exportGcnWorkout(currentWorkout);
      await pushWorkout(gcn);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Conversion failed";
      setPushing({ status: "error", message });
    }
  }, [currentWorkout, sessionActive, pushWorkout, setPushing]);

  return { push };
};
