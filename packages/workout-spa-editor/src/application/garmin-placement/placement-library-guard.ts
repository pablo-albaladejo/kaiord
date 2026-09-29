/**
 * Step 3 (design §3.3): no confirmed library id, no placement. The guarded
 * write sets `forceRepush`, so the next push re-creates the library workout
 * through the ledger's `updated` path — the way out of a legacy
 * `unconfirmed` library whose equal hash Phase 1 would skip forever.
 */
import type { GarminWorkoutId } from "../../types/garmin-ledger";
import type { LedgerKey, PlacementDeps } from "./placement-deps";
import {
  failed,
  type PlacementResult,
  recordDeleted,
} from "./placement-result";
import { decide } from "./placement-row";

export const guardLibrary = async (
  deps: Pick<PlacementDeps, "ledgerRepo">,
  key: LedgerKey
): Promise<GarminWorkoutId | PlacementResult> => {
  const { verdict } = await decide<GarminWorkoutId | PlacementResult>(
    deps,
    key,
    (row) => {
      if (!row) return { verdict: recordDeleted() };
      if (row.library?.kind === "confirmed")
        return { verdict: row.library.workoutId };
      return {
        write: { ...row, forceRepush: true },
        verdict: failed("library-id-unknown", true),
      };
    }
  );
  return verdict;
};
