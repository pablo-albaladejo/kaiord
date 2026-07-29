/**
 * buildDataRouteSignals — one-shot (non-reactive) `DataHubMatrixSignals`
 * snapshot for the `get_data_routes` chat tool. Wires the live signals the
 * matrix derivation needs (bridge discovery, the v24 connections store,
 * IntegrationPolicy rows, per-bridge sync freshness) as a plain async
 * function, so the application-layer tool never imports adapters directly
 * (patrón do-push-to-garmin.ts).
 *
 * It was written to mirror the Settings matrix's own hook. That hook died with
 * the matrix UI, so this is now the ONLY wiring of those signals — the chat
 * tool's answers depend on it alone.
 */
import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { isBridgeConnected } from "../../application/connections/connected-source";
import type { DataHubMatrixSignals } from "../../application/data-hub/build-data-hub-matrix";
import {
  byIntegrationId,
  readBridgeSyncStates,
} from "../../application/data-hub/read-bridge-sync-states";
import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import { integrationIdForBridge } from "../../integrations/integration-registry";
import type { PersistencePort } from "../../ports/persistence-port";
import { fetchPoliciesByDataType } from "./fetch-policies-by-data-type";

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
    isBridgeConnected: (bridgeId) =>
      isBridgeConnected(
        bridgeDiscovery.getExtensionId(bridgeId) !== null,
        connectionByProvider.get(integrationIdForBridge(bridgeId) ?? "")
      ),
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
