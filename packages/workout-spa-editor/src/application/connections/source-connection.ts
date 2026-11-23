import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { BridgeSessionSignal } from "./connection-source-status";
import { type ConnectionState, connectionStateOf } from "./connection-state";

type Signals = {
  isDiscovered: (bridgeId: string) => boolean;
  session: (bridgeId: string) => BridgeSessionSignal | undefined;
  hasSessionProbe: (bridgeId: string) => boolean;
};

/**
 * A missing extension wins over a disconnect: both are true, but the absent
 * extension is the blocking one. "Settled" is decided by the card that shows
 * the notice, so this never calls an extension absent on its own.
 */
export const sourceConnectionOf = (
  entry: IntegrationRegistryEntry,
  s: Signals,
  disconnected: boolean
): ConnectionState | null => {
  const bridgeId = entry.bridgeId;
  if (entry.mechanism !== "bridge" || bridgeId === null) return null;
  const installed = s.isDiscovered(bridgeId);
  if (installed && disconnected) return null;
  return connectionStateOf(s.session(bridgeId), {
    installed,
    settled: true,
    hasProbe: s.hasSessionProbe(bridgeId),
  });
};
