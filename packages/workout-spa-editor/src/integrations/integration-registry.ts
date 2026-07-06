/**
 * Integration Registry — single source of truth for external
 * integrations (extension bridges, API-key providers, manual entry,
 * and not-yet-supported aspirational brands).
 *
 * Collapses what used to be 3 independently hand-maintained,
 * mutually-inconsistent catalogs: `CONNECTIONS`
 * (AthleteConnections/connection-config.ts), and two separate
 * `KNOWN_BRIDGE_IDS` lists (hooks/use-discovered-bridges.ts and
 * ProfileManager/components/useDataFlowsAdd.ts — neither included
 * whoop-bridge, and train2go-bridge wasn't a connection at all).
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

import type { ConnectionMechanism } from "../types/connection";
import type { IntegrationPolicyDirection } from "../types/integration-policy";

export type IntegrationRegistryEntry = {
  id: string;
  name: string;
  mark: string;
  mechanism: ConnectionMechanism;
  bridgeId: string | null;
};

export const INTEGRATION_REGISTRY: readonly IntegrationRegistryEntry[] = [
  { id: "garmin", name: "Garmin", mark: "G", mechanism: "bridge", bridgeId: "garmin-bridge" },
  { id: "whoop", name: "WHOOP", mark: "Wh", mechanism: "bridge", bridgeId: "whoop-bridge" },
  {
    id: "train2go",
    name: "Train2Go",
    mark: "T2",
    mechanism: "bridge",
    bridgeId: "train2go-bridge",
  },
  { id: "manual", name: "Manual Entry", mark: "M", mechanism: "manual", bridgeId: null },
  {
    id: "intervals",
    name: "intervals.icu",
    mark: "i",
    mechanism: "api-key",
    bridgeId: null,
  },
  { id: "strava", name: "Strava", mark: "S", mechanism: "not-supported", bridgeId: null },
  { id: "wahoo", name: "Wahoo", mark: "W", mechanism: "not-supported", bridgeId: null },
  {
    id: "trainingpeaks",
    name: "TrainingPeaks",
    mark: "TP",
    mechanism: "not-supported",
    bridgeId: null,
  },
];

/** Bridge ids for every "bridge"-mechanism integration. Replaces the two
    independent KNOWN_BRIDGE_IDS lists that used to drift out of sync. */
export const KNOWN_BRIDGE_IDS: readonly string[] = INTEGRATION_REGISTRY.filter(
  (entry) => entry.mechanism === "bridge" && entry.bridgeId !== null
).map((entry) => entry.bridgeId as string);

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
 */
export function eligibleBridgeIds(
  dataType: ManagedDataType,
  direction: IntegrationPolicyDirection,
  capabilitiesFor: (bridgeId: string) => readonly string[]
): string[] {
  const token = MANAGED_DATA_REGISTRY[dataType].capabilities[direction];
  if (token === undefined) return [];
  return KNOWN_BRIDGE_IDS.filter((bridgeId) =>
    capabilitiesFor(bridgeId).includes(token)
  );
}
