import { useCallback } from "react";

import { useGarminStore } from "../../../store/garmin-store";
import { useWorkoutStore } from "../../../store/workout-store";
import { exportGcnWorkout } from "../../../utils/export-workout-formats";

export const useGarminPush = () => {
  const { pushWorkout, setPushing, sessionActive } = useGarminStore();
  const { currentWorkout } = useWorkoutStore();

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
