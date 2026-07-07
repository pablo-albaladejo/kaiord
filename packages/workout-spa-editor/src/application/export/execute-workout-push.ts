/**
 * executeWorkoutPush — React-free helper that governs every workout
 * export path (GarminPushButton/CoachingActivityDialog via the shared
 * useGarminPush hook, and the push_to_garmin chat tool) through the
 * SAME gate: resolveExportPolicies is consulted IN THE ACTION, not just
 * at render time — a disabled/absent policy used to still let the push
 * through since only the button's render-gating checked it.
 *
 * No active, enabled export route for (profileId, "workout",
 * destinationBridgeId) ⇒ a typed `NoActiveExportRouteError` with a
 * visible cause, never a silent no-op or a generic throw.
 *
 * The actual push is the injected `pushFn` — this module MUST NOT
 * import React hooks or @kaiord/garmin-connect (hexagonal boundary,
 * manually enforced pending a dependency-cruiser guard — see plan
 * Follow-ups). On success, records the push in the export ledger via
 * `recordExport` (already idempotent on re-push — see its tests).
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicyDeps } from "../integration-policy/integration-policy-deps";
import { resolveExportPolicies } from "../integration-policy/resolve-export-policies.use-case";
import type {
  RecordExportDeps,
  RecordExportResult,
} from "./record-export.use-case";
import { recordExport } from "./record-export.use-case";

const WORKOUT_DATA_TYPE: ManagedDataType = "workout";

export class NoActiveExportRouteError extends Error {
  readonly destinationBridgeId: string;
  constructor(destinationBridgeId: string) {
    super(
      `No active export route to ${destinationBridgeId} for workouts — enable it in Settings.`
    );
    this.name = "NoActiveExportRouteError";
    this.destinationBridgeId = destinationBridgeId;
  }
}

export type ExecuteWorkoutPushDeps = IntegrationPolicyDeps & RecordExportDeps;

export type ExecuteWorkoutPushInput = {
  profileId: string;
  kaiordRecordId: string;
  destinationBridgeId: string;
  payload: Record<string, unknown>;
  pushFn: (payload: Record<string, unknown>) => Promise<{ externalId: string }>;
};

export const executeWorkoutPush = async (
  deps: ExecuteWorkoutPushDeps,
  input: ExecuteWorkoutPushInput
): Promise<RecordExportResult> => {
  const { profileId, kaiordRecordId, destinationBridgeId, payload, pushFn } =
    input;
  const policies = await resolveExportPolicies(deps, {
    profileId,
    dataType: WORKOUT_DATA_TYPE,
  });
  const hasActiveRoute = policies.some(
    (p) => p.enabled && p.bridgeId === destinationBridgeId
  );
  if (!hasActiveRoute) {
    throw new NoActiveExportRouteError(destinationBridgeId);
  }
  return recordExport(deps, {
    kaiordRecordId,
    dataType: WORKOUT_DATA_TYPE,
    destinationBridgeId,
    payload,
    postFn: pushFn,
  });
};
