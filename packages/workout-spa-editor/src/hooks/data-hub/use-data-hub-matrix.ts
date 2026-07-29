/**
 * useDataHubMatrix — reactive Data Hub matrix for a profile (F4.1).
 *
 * Wires the live signals — the v24 `connections` store (real connection state,
 * never inferred from policies), bridge-discovery (online + announced
 * capabilities), IntegrationPolicy rows, and the per-bridge sync freshness —
 * into the pure `buildDataHubMatrix`. All derivation logic lives in that pure
 * function; this hook only supplies the signals.
 */
import { useMemo } from "react";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { isBridgeConnected } from "../../application/connections/connected-source";
import {
  buildDataHubMatrix,
  type DataHubRow,
} from "../../application/data-hub/build-data-hub-matrix";
import { useDataFlows } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { usePersistence } from "../../contexts/persistence-context";
import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import {
  INTEGRATION_REGISTRY,
  integrationIdForBridge,
} from "../../integrations/integration-registry";
import { useConnectionStatus } from "../use-connection-status";
import { useDiscoveredBridges } from "../use-discovered-bridges";
import { useBridgeSyncStates } from "./use-bridge-sync-states";

export const useDataHubMatrix = (profileId: string | null): DataHubRow[] => {
  const connections = useConnectionStatus(profileId);
  const discovered = useDiscoveredBridges();
  const { byDataType } = useDataFlows(profileId ?? "");
  const persistence = usePersistence();
  const syncedAt = useBridgeSyncStates(persistence, profileId);

  return useMemo(
    () =>
      buildDataHubMatrix(INTEGRATION_REGISTRY, {
        isConnected: (id) => connections.get(id)?.status === "connected",
        isBridgeConnected: (bridgeId) =>
          isBridgeConnected(
            discovered.some((d) => d.bridgeId === bridgeId),
            connections.get(integrationIdForBridge(bridgeId) ?? "")
          ),
        bridgeAnnounces: (bridgeId, token) =>
          (bridgeDiscovery.getCapabilities(bridgeId) ?? []).includes(token),
        supportsRoute: bridgeSupportsRoute,
        isRouteEnabled: (dataType, direction, bridgeId) =>
          (byDataType.get(dataType)?.[direction] ?? []).some(
            (p) => p.bridgeId === bridgeId && p.enabled
          ),
        lastSyncedAt: (id) => syncedAt.get(id),
        findRoute: (dataType, direction, bridgeId) => {
          const match = (byDataType.get(dataType)?.[direction] ?? []).find(
            (p) => p.bridgeId === bridgeId
          );
          return match ? { id: match.id, mode: match.mode } : undefined;
        },
      }),
    [connections, discovered, byDataType, syncedAt]
  );
};
