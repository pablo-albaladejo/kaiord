import { useCallback } from "react";

import { useAnalytics, useGarminBridge } from "../../../contexts";
import { useCurrentWorkout } from "../../../store/workout-store-selectors";
import { exportGcnWorkout } from "../../../utils/export-workout-formats";

export const useGarminPush = () => {
  const { pushWorkout, setPushing, sessionActive } = useGarminBridge();
  const currentWorkout = useCurrentWorkout();
  const analytics = useAnalytics();

  const push = useCallback(async () => {
    if (!currentWorkout || !sessionActive) return;

    try {
      const gcn = await exportGcnWorkout(currentWorkout);
      await pushWorkout(gcn);
      analytics.event("garmin-synced", { result: "success" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Conversion failed";
      setPushing({ status: "error", message });
      analytics.event("garmin-synced", { result: "failure" });
    }
  }, [currentWorkout, sessionActive, pushWorkout, setPushing, analytics]);

  return { push };
};
