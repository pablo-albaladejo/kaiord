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
  /** The extension answered, in a protocol version this build cannot read. */
  readonly outdated: boolean;
  readonly lastCheckedAt: number | null;
};

/**
 * `hasProbe` is whether a session prober is registered for this bridge — the
 * actual fact, injected by the hook layer. It is deliberately NOT inferred
 * from `lastCheckedAt === null`: `probeBridge` writes that same shape for a
 * PROBED bridge whose extension id changed mid-probe, which would put
 * Tanita's "cannot check without downloading your whole export" copy on a
 * WHOOP card.
 */
export const bridgeSourceStatus = (
  state: BridgeSessionSignal | undefined,
  connected: boolean,
  hasProbe: boolean
): ConnectionSourceStatus => {
  if (!connected || state === undefined) return "available";
  if (state.checking) return "checking";
  if (!hasProbe) return "installed";
  // Probed, but no answer on record yet: what its session is doing is not
  // known, and "checking" is the only state that says so.
  if (state.lastCheckedAt === null) return "checking";
  if (state.error !== null || state.needsReauth) return "attention";
  return state.sessionActive ? "connected" : "attention";
};

export const sourceStatus = (
  entry: IntegrationRegistryEntry,
  state: BridgeSessionSignal | undefined,
  connected: boolean,
  hasProbe: boolean
): ConnectionSourceStatus => {
  switch (entry.mechanism) {
    case "manual":
      return "manual";
    case "not-supported":
      return "unsupported";
    case "bridge":
      return bridgeSourceStatus(state, connected, hasProbe);
    default:
      return connected ? "connected" : "available";
  }
};
