/**
 * useDataHubMatrix — reactive Data Hub matrix for a profile (F4.1).
 *
 * Wires the live signals — the v24 `connections` store (real connection state,
 * never inferred from policies), bridge-discovery (online + announced
 * capabilities), IntegrationPolicy rows, and the Train2Go sync freshness — into
 * the pure `buildDataHubMatrix`. All derivation logic lives in that pure
 * function; this hook only supplies the signals.
 */
import { useMemo } from "react";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { useTrain2GoSyncState } from "../../adapters/train2go/use-train2go-data";
import {
  buildDataHubMatrix,
  type DataHubRow,
} from "../../application/data-hub/build-data-hub-matrix";
import { useDataFlows } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { usePersistence } from "../../contexts/persistence-context";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";
import { useConnectionStatus } from "../use-connection-status";
import { useDiscoveredBridges } from "../use-discovered-bridges";
import { useSourceSyncState } from "./use-source-sync-state";

const TRAIN2GO = "train2go";
const GARMIN = "garmin";
const GARMIN_BRIDGE = "garmin-bridge";

export const useDataHubMatrix = (profileId: string | null): DataHubRow[] => {
  const connections = useConnectionStatus(profileId);
  const discovered = useDiscoveredBridges();
  const { byDataType } = useDataFlows(profileId ?? "");
  const persistence = usePersistence();
  const train2goSyncedAt = useTrain2GoSyncState(persistence, profileId ?? "");
  const garminSyncedAt = useSourceSyncState(
    persistence,
    GARMIN_BRIDGE,
    profileId
  );

  return useMemo(
    () =>
      buildDataHubMatrix(INTEGRATION_REGISTRY, {
        isConnected: (id) => connections.get(id)?.status === "connected",
        isBridgeOnline: (bridgeId) =>
          discovered.some((d) => d.bridgeId === bridgeId),
        bridgeAnnounces: (bridgeId, token) =>
          (bridgeDiscovery.getCapabilities(bridgeId) ?? []).includes(token),
        isRouteEnabled: (dataType, direction, bridgeId) =>
          (byDataType.get(dataType)?.[direction] ?? []).some(
            (p) => p.bridgeId === bridgeId && p.enabled
          ),
        lastSyncedAt: (id) =>
          id === TRAIN2GO
            ? train2goSyncedAt
            : id === GARMIN
              ? garminSyncedAt
              : undefined,
        findRoute: (dataType, direction, bridgeId) => {
          const match = (byDataType.get(dataType)?.[direction] ?? []).find(
            (p) => p.bridgeId === bridgeId
          );
          return match ? { id: match.id, mode: match.mode } : undefined;
        },
      }),
    [connections, discovered, byDataType, train2goSyncedAt, garminSyncedAt]
  );
};
