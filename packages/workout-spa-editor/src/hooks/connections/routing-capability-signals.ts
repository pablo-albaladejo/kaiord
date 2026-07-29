/**
 * The live signals both routing derivations read, built once per render so the
 * ranking control and the on/off control can never disagree about a bridge.
 *
 * `capabilitiesFor` and `announces` answer the SAME question with opposite
 * defaults, on purpose. An unverified bridge (`null` capabilities) keeps its
 * enabled routes rankable — those records exist whether or not the extension is
 * running in this browser — while nothing unverified may be offered as a NEW
 * route, because switching one on claims the bridge can carry the type.
 */
import type { BridgeConnectionState } from "../../adapters/bridge/bridge-connection-types";
import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import { isBridgeConnected } from "../../application/connections/connected-source";
import type { RouteToggleSignals } from "../../application/connections/data-type-route-toggles";
import type { SourceCapabilitySignals } from "../../application/connections/source-of-truth-options";
import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import { integrationIdForBridge } from "../../integrations/integration-registry";
import type { ConnectionRecord } from "../../types/connection";

export type RoutingCapabilitySignals = SourceCapabilitySignals &
  RouteToggleSignals;

export const buildRoutingCapabilitySignals = (
  connections: readonly BridgeConnectionState[],
  records: ReadonlyMap<string, ConnectionRecord>
): RoutingCapabilitySignals => {
  const byBridge = new Map(connections.map((row) => [row.bridgeId, row]));
  const announced = new Map(
    connections.map((row) => [
      row.bridgeId,
      bridgeDiscovery.getCapabilities(row.bridgeId),
    ])
  );
  return {
    capabilitiesFor: (bridgeId) => announced.get(bridgeId) ?? null,
    announces: (bridgeId, token) =>
      (announced.get(bridgeId) ?? []).includes(token),
    supportsRoute: bridgeSupportsRoute,
    // The cards' own rule, called rather than re-derived: a source the user
    // explicitly unlinked must not be offered a fresh route by another surface
    // on the same page while its card reads "Not connected".
    isBridgeConnected: (bridgeId) =>
      isBridgeConnected(
        byBridge.get(bridgeId)?.discovered === true,
        records.get(integrationIdForBridge(bridgeId) ?? bridgeId)
      ),
  };
};
