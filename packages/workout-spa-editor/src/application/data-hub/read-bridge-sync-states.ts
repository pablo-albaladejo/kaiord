/**
 * Per-bridge `lastSyncedAt`, read once for every bridge integration.
 *
 * `coachingSyncState`'s primary key is `[source+profileId]` and the table has
 * no `profileId` index, so this is N point-gets rather than a scan. Callers
 * index the result by whichever key they speak — the Connections page's
 * routing rows by integration id, the connection model by bridge id — which is
 * why the rows carry both.
 */
import { syncSourceFor } from "../../integrations/bridge-sync-sources";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";
import type { CoachingSyncStateRepository } from "../../ports/persistence-port";

export type BridgeSyncState = {
  integrationId: string;
  bridgeId: string;
  lastSyncedAt: string | undefined;
};

const BRIDGE_INTEGRATIONS = INTEGRATION_REGISTRY.flatMap((entry) =>
  entry.mechanism === "bridge" && entry.bridgeId !== null
    ? [{ integrationId: entry.id, bridgeId: entry.bridgeId }]
    : []
);

export const readBridgeSyncStates = async (
  repo: CoachingSyncStateRepository,
  profileId: string
): Promise<readonly BridgeSyncState[]> => {
  const rows = await Promise.all(
    BRIDGE_INTEGRATIONS.map((entry) =>
      repo.getBySourceAndProfile(syncSourceFor(entry.bridgeId), profileId)
    )
  );
  return BRIDGE_INTEGRATIONS.map((entry, index) => ({
    ...entry,
    lastSyncedAt: rows[index]?.lastSyncedAt,
  }));
};

export const byIntegrationId = (
  states: readonly BridgeSyncState[]
): ReadonlyMap<string, string | undefined> =>
  new Map(states.map((s) => [s.integrationId, s.lastSyncedAt]));

export const byBridgeId = (
  states: readonly BridgeSyncState[]
): ReadonlyMap<string, string | undefined> =>
  new Map(states.map((s) => [s.bridgeId, s.lastSyncedAt]));
