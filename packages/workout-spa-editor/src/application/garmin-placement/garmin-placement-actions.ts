/**
 * The athlete's actions on a placement result, under the record's lock:
 * "It's in Garmin" on an `uncertain`, and "I removed it" on an abandoned
 * entry. Neither sends a `schedule`; only the confirmation drains.
 */
import { GARMIN_LEDGER_BRIDGE_ID } from "../../types/export-ledger";
import { confirmInGarmin } from "./placement-confirm";
import { dismissRemovalEntry } from "./placement-dismiss";
import { failed, type PlacementResult } from "./placement-result";
import { CALENDAR_FIND_FEATURE } from "./placement-timing";
import type { PlacementPipelineDeps } from "./push-workout-to-garmin-calendar";
import { placementLockName } from "./record-lock-port";

const keyOf = (kaiordRecordId: string) => ({
  kaiordRecordId,
  destinationBridgeId: GARMIN_LEDGER_BRIDGE_ID,
});

const underLock = async <T>(
  deps: PlacementPipelineDeps,
  kaiordRecordId: string,
  run: () => Promise<T>
): Promise<{ acquired: true; value: T } | { acquired: false }> =>
  deps.locks
    ? deps.locks.tryRun(placementLockName(kaiordRecordId), run)
    : { acquired: true, value: await run() };

export const confirmGarminPlacement = async (
  deps: PlacementPipelineDeps,
  kaiordRecordId: string
): Promise<PlacementResult> => {
  const lock = await underLock(deps, kaiordRecordId, () =>
    confirmInGarmin({
      deps: { ...deps, canFind: deps.features.includes(CALENDAR_FIND_FEATURE) },
      key: keyOf(kaiordRecordId),
      minted: false,
      sendAnyway: false,
    })
  );
  return lock.acquired ? lock.value : failed("busy", true);
};

/** `false` when the entry is not dismissable or the record is busy. */
export const dismissGarminRemovalEntry = async (
  deps: PlacementPipelineDeps,
  kaiordRecordId: string,
  workoutScheduleId: string
): Promise<boolean> => {
  const lock = await underLock(deps, kaiordRecordId, () =>
    dismissRemovalEntry(deps, keyOf(kaiordRecordId), workoutScheduleId)
  );
  return lock.acquired && lock.value;
};
