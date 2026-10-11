/**
 * useConnectionSources — the Connections page's card list.
 *
 * Discovery is read through the connection store's own `discovered` flag
 * rather than `useDiscoveredBridges`, so a card never reports a state the
 * store has not caught up with yet: the store subscribes to discovery, and a
 * bridge it has not refreshed reads as not connected rather than as an
 * installed-but-unprobed one. Capabilities are read inside the memo, which
 * re-runs whenever a row changes — and a row changes exactly when an
 * extension id does, which is the only thing that changes capabilities.
 */
import { useMemo } from "react";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { hasSessionProbe } from "../../adapters/bridge/bridge-session-probes";
import { buildConnectionSources } from "../../application/connections/build-connection-sources";
import type { ConnectionSource } from "../../application/connections/connection-source";
import { useActiveLocale } from "../../i18n/LocaleProvider";
import { getTranslate } from "../../i18n/use-translate";
import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";
import { useBridgeConnections } from "../use-bridge-connections";
import { useConnectionStatus } from "../use-connection-status";
import { localizeSourceNames } from "./localize-source-names";

export const useConnectionSources = (
  profileId: string | null
): readonly ConnectionSource[] => {
  const connections = useBridgeConnections(profileId);
  const records = useConnectionStatus(profileId);
  const locale = useActiveLocale();

  return useMemo(() => {
    const byBridge = new Map(connections.map((row) => [row.bridgeId, row]));
    const sources = buildConnectionSources(INTEGRATION_REGISTRY, {
      record: (integrationId) => records.get(integrationId),
      session: (bridgeId) => byBridge.get(bridgeId),
      isDiscovered: (bridgeId) => byBridge.get(bridgeId)?.discovered === true,
      hasSessionProbe,
      lastSyncAt: (bridgeId) => byBridge.get(bridgeId)?.lastSyncAt,
      announces: (bridgeId, token) =>
        (bridgeDiscovery.getCapabilities(bridgeId) ?? []).includes(token),
      supportsRoute: bridgeSupportsRoute,
    });
    return localizeSourceNames(sources, getTranslate("connections", locale));
  }, [connections, records, locale]);
};
