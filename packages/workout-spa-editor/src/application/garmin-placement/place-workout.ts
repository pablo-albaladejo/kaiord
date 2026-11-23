/**
 * One placement inside the record's lock: Phase 1, the pre-flight, the
 * library guard and Phase 2. A library workout Garmin no longer holds is
 * re-created and placed in the same send.
 */
import { GARMIN_LEDGER_BRIDGE_ID } from "../../types/export-ledger";
import { guardLibrary } from "./placement-library-guard";
import {
  isPhaseOneResult,
  type PlacementRequest,
  runPhaseOne,
} from "./placement-phase-one";
import type { PlacementPipelineDeps } from "./placement-pipeline-deps";
import { libraryOnlyReason } from "./placement-preflight";
import { failed, type PlacementResult } from "./placement-result";
import { CALENDAR_FIND_FEATURE } from "./placement-timing";
import { reconcileGarminPlacement } from "./reconcile-garmin-placement";

export const keyOf = (kaiordRecordId: string) => ({
  kaiordRecordId,
  destinationBridgeId: GARMIN_LEDGER_BRIDGE_ID,
});

const placeOnce = async (
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

/** A library workout Garmin no longer holds (the athlete deleted it there)
    is flagged for a re-push by the 404; the same Send re-creates it once
    and places that, so the athlete never has to press Send twice. */
export const place = async (
  deps: PlacementPipelineDeps,
  request: PlacementRequest
): Promise<PlacementResult> => {
  const result = await placeOnce(deps, request);
  const missing =
    result.kind === "failed" && result.reason === "library-missing";
  return missing ? placeOnce(deps, request) : result;
};
