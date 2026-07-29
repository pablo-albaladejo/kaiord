/**
 * Integration Registry — single source of truth for external
 * integrations (extension bridges, API-key providers, manual entry,
 * and not-yet-supported aspirational brands).
 *
 * Collapses what used to be 3 independently hand-maintained,
 * mutually-inconsistent catalogs: a `CONNECTIONS` catalog on the Athlete
 * page, and two separate `KNOWN_BRIDGE_IDS` lists (hooks/use-discovered-
 * bridges.ts and ProfileManager/components/useDataFlowsAdd.ts — neither
 * included whoop-bridge, and train2go-bridge wasn't a connection at all).
 * All three are gone; this is the only catalog left.
 *
 * Deliberately holds NO per-integration flow catalog: `eligibleBridgeIds`
 * derives which bridges can serve a (dataType, direction) flow from
 * `MANAGED_DATA_REGISTRY` intersected with that bridge's ACTUALLY
 * announced capabilities — never a hand-curated list per integration.
 * This module stays framework/adapter-free (no React, no bridge-discovery
 * import): callers inject the live capability lookup.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY } from "@kaiord/core";

import type { IntegrationPolicyDirection } from "../types/integration-policy";
import { bridgeSupportsRoute } from "./bridge-supported-routes";
import { INTEGRATION_REGISTRY_ENTRIES } from "./integration-registry-entries";

export type { IntegrationRegistryEntry } from "./integration-registry-entries";

export const INTEGRATION_REGISTRY = INTEGRATION_REGISTRY_ENTRIES;

/** Bridge ids for every "bridge"-mechanism integration. Replaces the two
    independent KNOWN_BRIDGE_IDS lists that used to drift out of sync. */
export const KNOWN_BRIDGE_IDS: readonly string[] = INTEGRATION_REGISTRY.filter(
  (entry) => entry.mechanism === "bridge" && entry.bridgeId !== null
).map((entry) => entry.bridgeId as string);

const INTEGRATION_BY_BRIDGE: ReadonlyMap<string, string> = new Map(
  INTEGRATION_REGISTRY.filter((entry) => entry.bridgeId !== null).map(
    (entry) => [entry.bridgeId as string, entry.id]
  )
);

/** The connection-record key (`providerId`) for a bridge. The `connections`
    store is keyed by integration id, discovery by bridge id, so any rule that
    reads both needs this one translation. */
export const integrationIdForBridge = (bridgeId: string): string | undefined =>
  INTEGRATION_BY_BRIDGE.get(bridgeId);

/**
 * Bridge ids that actually announce the wire capability token required
 * for (dataType, direction) — corrects the eligibility bug where every
 * known bridge was offered regardless of whether THAT bridge announced
 * the capability (e.g. `useDataFlowsAdd.ts` used to offer train2go-bridge
 * for a workout export it never supports).
 *
 * `capabilitiesFor` is injected so this stays a pure, adapter-free
 * function — callers pass `bridgeDiscovery.getCapabilities` (or a test
 * double).
 *
 * This guards policy-ELIGIBILITY derivations (which routes may be created).
 * The live UI chokepoint is the Data Hub cell-state signal `supportsRoute`
 * in application/data-hub/data-hub-cell-state.ts — both must apply the same
 * filter, so neither is the single place to change it.
 */
export function eligibleBridgeIds(
  dataType: ManagedDataType,
  direction: IntegrationPolicyDirection,
  capabilitiesFor: (bridgeId: string) => readonly string[]
): string[] {
  const token = MANAGED_DATA_REGISTRY[dataType].capabilities[direction];
  if (token === undefined) return [];
  return KNOWN_BRIDGE_IDS.filter(
    (bridgeId) =>
      capabilitiesFor(bridgeId).includes(token) &&
      // A shared token (read:body) over-claims: narrow to routes the SPA
      // actually serves so no phantom flow is ever offered.
      bridgeSupportsRoute(bridgeId, dataType, direction)
  );
}
