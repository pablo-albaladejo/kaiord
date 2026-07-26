/**
 * Entry map helpers for the bridge connection store: default rows, change
 * detection, and the signature-cached snapshot reader that
 * `useSyncExternalStore` needs (a fresh array on every read would loop).
 */
import type { BridgeConnectionRuntime } from "./bridge-connection-types";

export const undiscoveredEntry = (
  bridgeId: string
): BridgeConnectionRuntime => ({
  bridgeId,
  discovered: false,
  sessionActive: false,
  checking: false,
  error: null,
  needsReauth: false,
  lastCheckedAt: null,
});

const signatureOf = (entry: BridgeConnectionRuntime): string =>
  [
    entry.bridgeId,
    entry.discovered,
    entry.sessionActive,
    entry.checking,
    entry.error,
    entry.needsReauth,
    entry.lastCheckedAt,
  ].join("|");

/** Writes the patch and reports whether the row observably changed. */
export const applyEntry = (
  entries: Map<string, BridgeConnectionRuntime>,
  bridgeId: string,
  patch: Partial<BridgeConnectionRuntime>
): boolean => {
  const current = entries.get(bridgeId) ?? undiscoveredEntry(bridgeId);
  const next: BridgeConnectionRuntime = { ...current, ...patch, bridgeId };
  entries.set(bridgeId, next);
  return signatureOf(current) !== signatureOf(next);
};

export const createSnapshotReader = (
  entries: Map<string, BridgeConnectionRuntime>,
  bridgeIds: readonly string[]
): (() => readonly BridgeConnectionRuntime[]) => {
  let cached: readonly BridgeConnectionRuntime[] = [];
  let cachedSignature = "";
  return () => {
    const rows = bridgeIds.map(
      (bridgeId) => entries.get(bridgeId) ?? undiscoveredEntry(bridgeId)
    );
    const signature = rows.map(signatureOf).join("~");
    if (signature !== cachedSignature) {
      cachedSignature = signature;
      cached = rows;
    }
    return cached;
  };
};
