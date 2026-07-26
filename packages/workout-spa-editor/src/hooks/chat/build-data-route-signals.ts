/**
 * buildDataRouteSignals — one-shot (non-reactive) `DataHubMatrixSignals`
 * snapshot for the `get_data_routes` chat tool. Mirrors
 * `useDataHubMatrix`'s signal wiring (bridge discovery, the v24
 * connections store, IntegrationPolicy rows, per-bridge sync freshness) as
 * a plain async function, so the application-layer tool never imports
 * adapters directly (patrón do-push-to-garmin.ts).
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import type { DataHubMatrixSignals } from "../../application/data-hub/build-data-hub-matrix";
import {
  byIntegrationId,
  readBridgeSyncStates,
} from "../../application/data-hub/read-bridge-sync-states";
import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import type { PersistencePort } from "../../ports/persistence-port";
import type { IntegrationPolicy } from "../../types/integration-policy";

type ByDataType = Map<
  ManagedDataType,
  { import: IntegrationPolicy[]; export: IntegrationPolicy[] }
>;

const fetchPoliciesByDataType = async (
  persistence: PersistencePort,
  profileId: string
): Promise<ByDataType> => {
  const byDataType: ByDataType = new Map();
  for (const dataType of managedDataTypes) {
    const reg = MANAGED_DATA_REGISTRY[dataType];
    const [imports, exports] = await Promise.all([
      reg.capabilities.import
        ? persistence.integrationPolicy.findByProfileDirection({
            profileId,
            dataType,
            direction: "import",
          })
        : Promise.resolve([]),
      reg.capabilities.export
        ? persistence.integrationPolicy.findByProfileDirection({
            profileId,
            dataType,
            direction: "export",
          })
        : Promise.resolve([]),
    ]);
    byDataType.set(dataType, { import: imports, export: exports });
  }
  return byDataType;
};

export const buildDataRouteSignals = async (
  persistence: PersistencePort,
  profileId: string
): Promise<DataHubMatrixSignals> => {
  const [connections, byDataType, syncStates] = await Promise.all([
    persistence.connections.getByProfile(profileId),
    fetchPoliciesByDataType(persistence, profileId),
    readBridgeSyncStates(persistence.coachingSyncState, profileId).then(
      byIntegrationId
    ),
  ]);
  const connectionByProvider = new Map(
    connections.map((c) => [c.providerId, c])
  );

  return {
    isConnected: (id) => connectionByProvider.get(id)?.status === "connected",
    isBridgeOnline: (bridgeId) =>
      bridgeDiscovery.getExtensionId(bridgeId) !== null,
    bridgeAnnounces: (bridgeId, token) =>
      (bridgeDiscovery.getCapabilities(bridgeId) ?? []).includes(token),
    supportsRoute: bridgeSupportsRoute,
    isRouteEnabled: (dataType, direction, bridgeId) =>
      (byDataType.get(dataType)?.[direction] ?? []).some(
        (p) => p.bridgeId === bridgeId && p.enabled
      ),
    lastSyncedAt: (id) => syncStates.get(id),
    findRoute: (dataType, direction, bridgeId) => {
      const match = (byDataType.get(dataType)?.[direction] ?? []).find(
        (p) => p.bridgeId === bridgeId
      );
      return match ? { id: match.id, mode: match.mode } : undefined;
    },
  };
};
