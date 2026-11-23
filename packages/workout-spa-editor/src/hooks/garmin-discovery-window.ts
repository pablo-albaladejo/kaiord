import { DISCOVER_REQUEST_DELAY_MS } from "../adapters/bridge/bridge-discovery";
import { PING_TIMEOUT_MS } from "../adapters/bridge/bridge-transport";
import { discoveryStartedAt } from "./discovery-clock";

/**
 * Milliseconds until discovery has had its window (the same window the
 * Connections page waits for), or 0 once it has. Before that, a Garmin
 * extension that has not announced yet is "checking", never "not-installed".
 */
export const msUntilDiscoverySettled = (now: number = Date.now()): number =>
  Math.max(
    discoveryStartedAt() + DISCOVER_REQUEST_DELAY_MS + PING_TIMEOUT_MS - now,
    0
  );
