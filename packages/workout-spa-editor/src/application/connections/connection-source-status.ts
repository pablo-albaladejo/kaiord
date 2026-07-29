/**
 * Status derivation for one source card.
 *
 * The vocabulary is deliberately narrower than the reference design's. There
 * is no "token expired": no bridge distinguishes an expired credential from
 * one that was never issued (`probeWhoopSession` leaves `needsReauth` false),
 * so a discovered bridge without a usable session reads as signed out.
 */
import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { ConnectionSourceStatus } from "./connection-source";

/**
 * The read-only half of a runtime bridge row this derivation needs. Declared
 * here rather than imported so the layer stays adapter-free; the store's
 * `BridgeConnectionState` satisfies it structurally.
 */
export type BridgeSessionSignal = {
  readonly sessionActive: boolean;
  readonly checking: boolean;
  readonly error: string | null;
  readonly needsReauth: boolean;
  readonly lastCheckedAt: number | null;
};

/**
 * A discovered bridge that is not being probed and has never been probed has
 * no prober: the refresh pass writes it discovered-only and never messages
 * it. `tanita-bridge` is that bridge — its `checkSession` downloads the whole
 * export CSV — so it can only ever report that the extension is present.
 */
const isProbeless = (state: BridgeSessionSignal): boolean =>
  !state.checking && state.lastCheckedAt === null;

export const bridgeSourceStatus = (
  state: BridgeSessionSignal | undefined,
  connected: boolean
): ConnectionSourceStatus => {
  if (!connected || state === undefined) return "available";
  if (state.checking) return "checking";
  if (isProbeless(state)) return "installed";
  if (state.error !== null || state.needsReauth) return "attention";
  return state.sessionActive ? "connected" : "attention";
};

export const sourceStatus = (
  entry: IntegrationRegistryEntry,
  state: BridgeSessionSignal | undefined,
  connected: boolean
): ConnectionSourceStatus => {
  switch (entry.mechanism) {
    case "manual":
      return "manual";
    case "not-supported":
      return "unsupported";
    case "bridge":
      return bridgeSourceStatus(state, connected);
    default:
      return connected ? "connected" : "available";
  }
};
