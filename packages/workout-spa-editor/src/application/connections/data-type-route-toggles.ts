/**
 * Which sources MAY send one data type, and whether each is switched on.
 *
 * This is a different question from `source-of-truth-options`, and conflating
 * them is what left the capability unreachable: that module ranks the sources
 * a type already has, while this one decides whether a route exists at all.
 * A type with no enabled route has nothing to rank, so a ranking control alone
 * can never switch importing on.
 *
 * Two admission rules, deliberately asymmetric:
 *
 *  - A route that is ON is always listed, whatever its bridge is doing now, so
 *    it can always be switched back off. Dropping it while the extension is
 *    absent would strand an enabled route the resolver still reads from.
 *  - A route that is OFF is listed only when its bridge is connected AND is
 *    announcing the wire token for this type right now. `announces` answers
 *    false while a bridge is unverified, which is the conservative half of the
 *    same asymmetry `source-of-truth-options` documents: offering to switch on
 *    a route that cannot carry anything would create exactly the phantom the
 *    retired matrix rendered as `na`.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY } from "@kaiord/core";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { BridgeRouteSignals } from "./bridge-route-types";

export type DataTypeRouteToggle = {
  readonly bridgeId: string;
  /** The connection-record key, so copy names the source the cards name. */
  readonly integrationId: string;
  readonly enabled: boolean;
};

export type RouteToggleSignals = BridgeRouteSignals & {
  isBridgeConnected: (bridgeId: string) => boolean;
};

export const buildRouteToggles = (
  dataType: ManagedDataType,
  integrations: readonly IntegrationRegistryEntry[],
  routes: readonly IntegrationPolicy[],
  signals: RouteToggleSignals
): DataTypeRouteToggle[] => {
  const token = MANAGED_DATA_REGISTRY[dataType].capabilities.import;
  if (token === undefined) return [];
  const on = new Set(
    routes.filter((route) => route.enabled).map((route) => route.bridgeId)
  );
  return integrations.flatMap((entry) => {
    const bridgeId = entry.bridgeId;
    if (entry.mechanism !== "bridge" || bridgeId === null) return [];
    if (!signals.supportsRoute(bridgeId, dataType, "import")) return [];
    const enabled = on.has(bridgeId);
    const offerable =
      signals.isBridgeConnected(bridgeId) && signals.announces(bridgeId, token);
    if (!enabled && !offerable) return [];
    return [{ bridgeId, integrationId: entry.id, enabled }];
  });
};
