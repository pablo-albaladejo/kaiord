/**
 * Unified per-bridge connection state.
 *
 * `BridgeConnectionRuntime` is the in-memory half owned by the connection
 * store (never persisted — see `bridge-store-persistence-boundary.test.ts`).
 * `BridgeConnectionState` is what consumers see: the same shape plus the
 * `lastSyncAt` timestamp read from the existing `coachingSyncState` rows.
 */
import type { SessionProber } from "./bridge-session-probe-types";

export type BridgeConnectionRuntime = {
  readonly bridgeId: string;
  readonly discovered: boolean;
  readonly sessionActive: boolean;
  readonly checking: boolean;
  readonly error: string | null;
  readonly needsReauth: boolean;
  /** The extension answered with an unsupported protocol version. */
  readonly outdated: boolean;
  readonly lastCheckedAt: number | null;
};

export type BridgeConnectionState = BridgeConnectionRuntime & {
  readonly lastSyncAt: string | undefined;
};

export type BridgeConnectionStore = {
  start: () => void;
  stop: () => void;
  getSnapshot: () => readonly BridgeConnectionRuntime[];
  subscribe: (listener: () => void) => () => void;
  refresh: (opts?: { force?: boolean }) => Promise<void>;
};

export type CreateBridgeConnectionStoreOptions = {
  probes?: Record<string, SessionProber>;
  bridgeIds?: readonly string[];
  getExtensionId?: (bridgeId: string) => string | null;
  subscribeDiscovery?: (listener: () => void) => () => void;
  now?: () => number;
};
