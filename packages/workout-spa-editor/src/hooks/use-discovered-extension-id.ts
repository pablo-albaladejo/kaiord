/**
 * useDiscoveredExtensionId
 *
 * React hook that subscribes to the bridge discovery singleton and
 * returns the currently announced extension id for a given bridge
 * (or `null` before any verified announcement arrives).
 */

import { useSyncExternalStore } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";

export const useDiscoveredExtensionId = (bridgeId: string): string | null =>
  useSyncExternalStore(
    (listener) => bridgeDiscovery.subscribe(listener),
    () => bridgeDiscovery.getExtensionId(bridgeId),
    () => null
  );
