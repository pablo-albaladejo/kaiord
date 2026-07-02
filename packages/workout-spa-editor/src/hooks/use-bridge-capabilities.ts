/**
 * Reactive view of a single discovered bridge's verified capabilities.
 *
 * Sourced from `bridgeDiscovery.getCapabilities` (the pinged manifest, not
 * the spoofable wire announcement). Drives capability-gated UI such as the
 * Athlete Connections flow list — see `AthleteConnections/flow-availability.ts`.
 */

import { useSyncExternalStore } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";

const EMPTY: readonly string[] = [];

export const useBridgeCapabilities = (bridgeId: string): readonly string[] =>
  useSyncExternalStore(
    (callback) => bridgeDiscovery.subscribe(callback),
    () => bridgeDiscovery.getCapabilities(bridgeId) ?? EMPTY,
    () => EMPTY
  );
