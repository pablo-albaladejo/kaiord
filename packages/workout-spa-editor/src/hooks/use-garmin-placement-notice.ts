import { useLiveQuery } from "dexie-react-hooks";

import {
  type PlacementNotice,
  placementNotice,
} from "../application/garmin-placement/placement-notice";
import type { PlacementResult } from "../application/garmin-placement/placement-result";
import { usePlacementOutcome } from "../contexts/placement-outcome-context";
import { GARMIN_BRIDGE_ID, ledgerRepo } from "./garmin-push-fn";

export type GarminPlacementNotice = PlacementNotice & {
  /** Records the last run's outcome for this record. */
  setLastRun: (result: PlacementResult | undefined) => void;
};

/**
 * The record's placement notice: its ledger row, read live (one query per
 * page), joined with the last run's ephemeral outcome.
 */
export const useGarminPlacementNotice = (
  recordId: string | undefined
): GarminPlacementNotice => {
  const row = useLiveQuery(
    () =>
      recordId
        ? ledgerRepo.findByNaturalKey({
            kaiordRecordId: recordId,
            destinationBridgeId: GARMIN_BRIDGE_ID,
          })
        : undefined,
    [recordId]
  );
  const [lastRun, setLastRun] = usePlacementOutcome(recordId);
  return { ...placementNotice(row, lastRun), setLastRun };
};
