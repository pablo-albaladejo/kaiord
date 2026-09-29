/**
 * The single entry point of every Garmin push (design §3.3): Phase 1 (the
 * library push), then Phase 2 (the calendar placement), under one Web Lock
 * per record. A second push of the record in the same tab joins the running
 * one (`placement-join`); a lock held by another tab is `failed:busy` with
 * 0 calls.
 */
import type { Analytics } from "@kaiord/core";

import { GARMIN_LEDGER_BRIDGE_ID } from "../../types/export-ledger";
import { measuredPlacement } from "./placement-analytics";
import type { PlacementDeps } from "./placement-deps";
import { joinRun, ownJoin, type PlacementJoin } from "./placement-join";
import { guardLibrary } from "./placement-library-guard";
import {
  isPhaseOneResult,
  type PlacementRequest,
  runPhaseOne,
} from "./placement-phase-one";
import { libraryOnlyReason } from "./placement-preflight";
import { failed, type PlacementResult } from "./placement-result";
import { CALENDAR_FIND_FEATURE } from "./placement-timing";
import { reconcileGarminPlacement } from "./reconcile-garmin-placement";
import { placementLockName, type RecordLockPort } from "./record-lock-port";

export type { PlacementRequest };

export type PlacementPipelineDeps = Omit<PlacementDeps, "canFind"> & {
  /** The bridge's ping `features`. */
  features: readonly string[];
  /** Web Locks; `undefined` in a non-secure context or an old browser. */
  locks: RecordLockPort | undefined;
  /** `isSecureContext`: tells an insecure page from an old browser. */
  secureContext: boolean;
  /** In-tab runs by record id, shared by every caller of the tab. */
  joins: Map<string, PlacementJoin>;
  analytics?: Analytics;
};

const keyOf = (kaiordRecordId: string) => ({
  kaiordRecordId,
  destinationBridgeId: GARMIN_LEDGER_BRIDGE_ID,
});

const place = async (
  deps: PlacementPipelineDeps,
  request: PlacementRequest
): Promise<PlacementResult> => {
  const key = keyOf(request.kaiordRecordId);
  const phaseOne = await runPhaseOne(deps, key, request);
  if (isPhaseOneResult(phaseOne)) return phaseOne;
  const libraryOnly = libraryOnlyReason(deps);
  if (libraryOnly) return libraryOnly;
  try {
    const workoutId = await guardLibrary(deps, key);
    if (typeof workoutId !== "string") return workoutId;
    return await reconcileGarminPlacement({
      deps: { ...deps, canFind: deps.features.includes(CALENDAR_FIND_FEATURE) },
      key,
      desired: { workoutId, date: request.date },
      minted: phaseOne.minted,
      sendAnyway: request.sendAnyway ?? false,
    });
  } catch {
    // The library push succeeded: a re-send places the date.
    return failed("placement-interrupted", true);
  }
};

const lockedPlace = async (
  deps: PlacementPipelineDeps,
  request: PlacementRequest
): Promise<PlacementResult> => {
  if (!deps.locks) return place(deps, request);
  const lock = await deps.locks.tryRun(
    placementLockName(request.kaiordRecordId),
    () => place(deps, request)
  );
  return lock.acquired ? lock.value : failed("busy", true);
};

export const pushWorkoutToGarminCalendar = (
  deps: PlacementPipelineDeps,
  request: PlacementRequest
): Promise<PlacementResult> => {
  const id = request.kaiordRecordId;
  const running = deps.joins.get(id);
  if (running) return joinRun(running, request);
  const join = ownJoin(request, (owned) =>
    measuredPlacement(deps, keyOf(id), () => lockedPlace(deps, owned)).finally(
      () => deps.joins.delete(id)
    )
  );
  deps.joins.set(id, join);
  return join.result;
};
