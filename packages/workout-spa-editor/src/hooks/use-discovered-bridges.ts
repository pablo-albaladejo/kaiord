/**
 * Reactive view of the bridge-discovery singleton's known bridges.
 *
 * The singleton lives at `adapters/bridge/bridge-discovery` as an
 * in-memory Map keyed by bridgeId; this hook exposes the
 * (bridgeId, extensionId) pairs as a stable React snapshot via
 * `useSyncExternalStore`. Re-renders fire when the discovery
 * receives a new announcement.
 */

import { useSyncExternalStore } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { KNOWN_BRIDGE_IDS } from "../integrations/integration-registry";

export type DiscoveredBridge = {
  readonly bridgeId: string;
  readonly extensionId: string;
};

// useSyncExternalStore requires a stable snapshot — returning a fresh
// array on every call triggers an infinite re-render loop. Cache by
// a string signature derived from the (bridgeId, extensionId) pairs.
let cached: readonly DiscoveredBridge[] = [];
let cachedSignature = "";

const snapshot = (): readonly DiscoveredBridge[] => {
  const pairs: DiscoveredBridge[] = [];
  for (const bridgeId of KNOWN_BRIDGE_IDS) {
    const extensionId = bridgeDiscovery.getExtensionId(bridgeId);
    if (extensionId) pairs.push({ bridgeId, extensionId });
  }
  const signature = pairs
    .map((p) => `${p.bridgeId}=${p.extensionId}`)
    .join("|");
  if (signature !== cachedSignature) {
    cachedSignature = signature;
    cached = pairs;
  }
  return cached;
};

const EMPTY: readonly DiscoveredBridge[] = [];

export const useDiscoveredBridges = (): readonly DiscoveredBridge[] =>
  useSyncExternalStore(
    (callback) => bridgeDiscovery.subscribe(callback),
    snapshot,
    () => EMPTY
  );
