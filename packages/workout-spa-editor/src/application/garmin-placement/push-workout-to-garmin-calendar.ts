/**
 * The single entry point of every Garmin push (design §3.3): Phase 1 (the
 * library push), then Phase 2 (the calendar placement), under one Web Lock
 * per record. A second push of the record in the same tab joins the running
 * one (`placement-join`); a lock held by another tab is `failed:busy` with
 * 0 calls.
 */
import { keyOf, place } from "./place-workout";
import { measuredPlacement } from "./placement-analytics";
import { joinRun, ownJoin } from "./placement-join";
import type { PlacementRequest } from "./placement-phase-one";
import type { PlacementPipelineDeps } from "./placement-pipeline-deps";
import { failed, type PlacementResult } from "./placement-result";
import { placementLockName } from "./record-lock-port";

export type { PlacementPipelineDeps, PlacementRequest };

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
