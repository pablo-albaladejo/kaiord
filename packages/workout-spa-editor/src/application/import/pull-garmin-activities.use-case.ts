/**
 * pullGarminActivities — governed import of executed Garmin activities (F5.3).
 *
 * The action consults the route policy BEFORE fetching (fail-closed forward):
 * without an enabled `activity←garmin-bridge` import route the pull never
 * touches the bridge, and the caller surfaces a visible "route inactive"
 * state (kill test). When active, each activity is deduped through
 * `ActivityRepository.upsertByExternalId` (Garmin activityId natural key) and
 * a `coachingSyncState` row records source + timestamp so the matrix cell
 * shows freshness. Pure application layer: the bridge read is injected.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { ActivityRepository } from "../../ports/activity-repository";
import type { CoachingSyncStateRepository } from "../../ports/persistence-port";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { resolveImportPolicies } from "../integration-policy/resolve-import-policies.use-case";
import type { GarminActivitiesResponse } from "./garmin-activity-schema";
import { GARMIN_BRIDGE_SOURCE, mapGarminActivity } from "./map-garmin-activity";

const ACTIVITY: ManagedDataType = "activity";

export type PullGarminActivitiesDeps = {
  policyRepo: IntegrationPolicyRepository;
  activities: ActivityRepository;
  coachingSyncState: CoachingSyncStateRepository;
  readActivities: () => Promise<GarminActivitiesResponse>;
  now?: () => string;
};

export type PullGarminActivitiesResult =
  | {
      ok: true;
      imported: number;
      skipped: number;
      disabled: boolean;
      throttled: boolean;
    }
  | { ok: false; reason: "route-inactive" | "transport-error"; error?: string };

export const pullGarminActivities = async (
  deps: PullGarminActivitiesDeps,
  profileId: string
): Promise<PullGarminActivitiesResult> => {
  const policies = await resolveImportPolicies(
    { policyRepo: deps.policyRepo },
    { profileId, dataType: ACTIVITY }
  );
  const active = policies.some(
    (p) => p.enabled && p.bridgeId === GARMIN_BRIDGE_SOURCE
  );
  if (!active) return { ok: false, reason: "route-inactive" };

  let response: GarminActivitiesResponse;
  try {
    response = await deps.readActivities();
  } catch (err) {
    return {
      ok: false,
      reason: "transport-error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (response.disabled || response.throttled) {
    return {
      ok: true,
      imported: 0,
      skipped: 0,
      disabled: response.disabled,
      throttled: response.throttled,
    };
  }

  let imported = 0;
  let skipped = 0;
  for (const raw of response.activities) {
    const record = mapGarminActivity(raw, profileId);
    if (!record) {
      skipped += 1;
      continue;
    }
    const { created } = await deps.activities.upsertByExternalId(record);
    if (created) imported += 1;
    else skipped += 1;
  }

  const now = deps.now?.() ?? new Date().toISOString();
  await deps.coachingSyncState.put({
    source: GARMIN_BRIDGE_SOURCE,
    profileId,
    lastSyncedAt: now,
  });
  return { ok: true, imported, skipped, disabled: false, throttled: false };
};
