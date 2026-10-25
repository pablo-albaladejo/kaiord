import { useLiveQuery } from "dexie-react-hooks";

import { GARMIN_BRIDGE_ID, ledgerRepo } from "./garmin-push-fn";

/** A workout's Garmin ledger row, live; `undefined` while unread or absent. */
export const useGarminLedgerRow = (workoutId: string) =>
  useLiveQuery(
    () =>
      ledgerRepo.findByNaturalKey({
        kaiordRecordId: workoutId,
        destinationBridgeId: GARMIN_BRIDGE_ID,
      }),
    [workoutId]
  );
