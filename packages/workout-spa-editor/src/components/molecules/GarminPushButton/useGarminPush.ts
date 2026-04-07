import { useCallback } from "react";

import { useGarminStore } from "../../../store/garmin-store";
import { useWorkoutStore } from "../../../store/workout-store";
import { exportGcnWorkout } from "../../../utils/export-workout-formats";

export const useGarminPush = () => {
  const { pushWorkout, sessionActive } = useGarminStore();
  const { currentWorkout } = useWorkoutStore();

  const push = useCallback(async () => {
    if (!currentWorkout || !sessionActive) return;

    const gcn = await exportGcnWorkout(currentWorkout);
    await pushWorkout(gcn);
  }, [currentWorkout, sessionActive, pushWorkout]);

  return { push };
};
