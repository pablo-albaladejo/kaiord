import { useCallback } from "react";

import {
  confirmGarminPlacement,
  dismissGarminRemovalEntry,
} from "../../../application/garmin-placement/garmin-placement-actions";
import { dismissableEntries } from "../../../application/garmin-placement/placement-dismiss";
import { useAnalytics, useGarminBridge } from "../../../contexts";
import { buildPlacementDeps } from "../../../hooks/garmin-placement-deps";
import { GARMIN_BRIDGE_ID, ledgerRepo } from "../../../hooks/garmin-push-fn";

/**
 * The athlete's answers to a placement result, for one workout: "It's in
 * Garmin" on an `uncertain`, and "I removed it" on an abandoned entry
 * (`dismissable` lists them; a `held` entry is never among them).
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

  const dismissable = useCallback(async () => {
    if (!recordId) return [];
    const row = await ledgerRepo.findByNaturalKey({
      kaiordRecordId: recordId,
      destinationBridgeId: GARMIN_BRIDGE_ID,
    });
    return dismissableEntries(row);
  }, [recordId]);

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

  return { confirm, dismissable, dismiss };
};
