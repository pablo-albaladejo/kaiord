/**
 * syncWhoopActivities — governed import of WHOOP cycle workouts into
 * executed `activity` records (Wave 3b.2).
 *
 * Mirrors `pullGarminActivities`: the `activity←whoop-bridge` import policy
 * is consulted BEFORE any fetch (fail-closed forward). Once active, the
 * sports catalog is resolved ONCE per sync via `resolveWhoopSportCatalog`
 * (a workout carries only a numeric `sport_id`), then each `chunkWindow`
 * page of `cycles/details` is imported via `importWhoopCycleWorkouts`. A
 * `coachingSyncState` row records source + timestamp so the matrix cell
 * shows freshness. Pure application layer: both bridge reads are injected.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { ActivityRepository } from "../../ports/activity-repository";
import type { CoachingSyncStateRepository } from "../../ports/persistence-port";
import { WHOOP_BRIDGE_SOURCE } from "../import/map-whoop-activity";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { resolveImportPolicies } from "../integration-policy/resolve-import-policies.use-case";
import { importWhoopCycleWorkouts } from "./import-whoop-cycle-workouts";
import { buildCyclesPath, chunkWindow } from "./whoop-cycles-window";
import type { WhoopFetchResult } from "./whoop-fetch-result";
import { resolveWhoopSportCatalog } from "./whoop-sport-catalog";

const ACTIVITY: ManagedDataType = "activity";

export type SyncWhoopActivitiesDeps = {
  policyRepo: IntegrationPolicyRepository;
  activities: ActivityRepository;
  coachingSyncState: CoachingSyncStateRepository;
  fetchCycles: (path: string) => Promise<WhoopFetchResult>;
  fetchSports: () => Promise<WhoopFetchResult>;
  now?: () => string;
};

export type SyncWhoopActivitiesInput = {
  profileId: string;
  userId: number;
  startTime: string;
  endTime: string;
};

export type SyncWhoopActivitiesResult =
  | { ok: true; imported: number; skipped: number }
  | { ok: false; reason: "route-inactive" | "transport-error"; error?: string };

const isActiveRoute = async (
  policyRepo: IntegrationPolicyRepository,
  profileId: string
): Promise<boolean> => {
  const policies = await resolveImportPolicies(
    { policyRepo },
    { profileId, dataType: ACTIVITY }
  );
  return policies.some((p) => p.enabled && p.bridgeId === WHOOP_BRIDGE_SOURCE);
};

export const syncWhoopActivities = async (
  deps: SyncWhoopActivitiesDeps,
  input: SyncWhoopActivitiesInput
): Promise<SyncWhoopActivitiesResult> => {
  if (!(await isActiveRoute(deps.policyRepo, input.profileId))) {
    return { ok: false, reason: "route-inactive" };
  }

  const catalogOutcome = await resolveWhoopSportCatalog(deps.fetchSports);
  if (!catalogOutcome.ok) {
    return {
      ok: false,
      reason: "transport-error",
      error: catalogOutcome.error,
    };
  }

  let imported = 0;
  let skipped = 0;
  for (const window of chunkWindow(input.startTime, input.endTime)) {
    const path = buildCyclesPath(input.userId, window);
    const outcome = await importWhoopCycleWorkouts(
      deps.activities,
      input.profileId,
      deps.fetchCycles,
      path,
      catalogOutcome.catalog
    );
    if (!outcome.ok) {
      return { ok: false, reason: "transport-error", error: outcome.error };
    }
    imported += outcome.counts.imported;
    skipped += outcome.counts.skipped;
  }

  const now = deps.now?.() ?? new Date().toISOString();
  await deps.coachingSyncState.put({
    source: WHOOP_BRIDGE_SOURCE,
    profileId: input.profileId,
    lastSyncedAt: now,
  });
  return { ok: true, imported, skipped };
};
