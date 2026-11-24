/**
 * Which known extensions announced themselves on a protocol this App does not
 * accept, as a stable string snapshot of the discovery singleton. Discovery
 * does not register them, so this is the only place their Connection learns
 * it is "outdated" rather than absent.
 */
import { useSyncExternalStore } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { KNOWN_BRIDGE_IDS } from "../integrations/integration-registry";

const snapshot = (): string =>
  KNOWN_BRIDGE_IDS.filter((id) => bridgeDiscovery.isOutdated?.(id) === true)
    .sort()
    .join(",");

const subscribe = (listener: () => void) => bridgeDiscovery.subscribe(listener);

/** Comma-joined bridge ids; "" when none is outdated. */
export const useOutdatedBridges = (): string =>
  useSyncExternalStore(subscribe, snapshot, () => "");
