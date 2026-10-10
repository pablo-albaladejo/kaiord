import { useCallback } from "react";

import {
  confirmGarminPlacement,
  dismissGarminRemovalEntry,
} from "../../../application/garmin-placement/garmin-placement-actions";
import { useAnalytics, useGarminBridge } from "../../../contexts";
import { buildPlacementDeps } from "../../../hooks/garmin-placement-deps";

/**
 * The athlete's answers to a placement result, for one workout: "It's in
 * Garmin" on an `uncertain`, and "I removed it" on an abandoned entry
 * (a `held` entry is never dismissable).
 */
export const useGarminPlacementActions = (recordId: string | undefined) => {
  const { features } = useGarminBridge();
  const analytics = useAnalytics();

  const confirm = useCallback(
    async () =>
      recordId
        ? confirmGarminPlacement(
            buildPlacementDeps(features, analytics),
            recordId
          )
        : undefined,
    [recordId, features, analytics]
  );

  const dismiss = useCallback(
    async (workoutScheduleId: string) =>
      recordId
        ? dismissGarminRemovalEntry(
            buildPlacementDeps(features, analytics),
            recordId,
            workoutScheduleId
          )
        : false,
    [recordId, features, analytics]
  );

  return { confirm, dismiss };
};
