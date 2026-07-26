/**
 * Bridge Connection Store
 *
 * One in-memory `BridgeConnectionRuntime` per known bridge, derived from
 * bridge-discovery (which bridges exist) plus a per-bridge session probe
 * (whether each holds a live upstream session). State is runtime-only and
 * never reaches Dexie — the persistence boundary guard enforces that.
 *
 * Probes deliberately run OUTSIDE `BRIDGE_QUEUE`: a status probe must not
 * queue behind a 30-second read, and it must not consume the protocol's
 * 60-operations-per-hour budget that real data operations need.
 */
import { KNOWN_BRIDGE_IDS } from "../../integrations/integration-registry";
import type { RefreshContext } from "./bridge-connection-context";
import { createSnapshotReader } from "./bridge-connection-entries";
import { createLifecycle } from "./bridge-connection-lifecycle";
import { refreshConnections } from "./bridge-connection-refresh";
import type {
  BridgeConnectionRuntime,
  BridgeConnectionStore,
  CreateBridgeConnectionStoreOptions,
} from "./bridge-connection-types";
import { bridgeDiscovery } from "./bridge-discovery";
import { SESSION_PROBES } from "./bridge-session-probes";

export function createBridgeConnectionStore(
  options: CreateBridgeConnectionStoreOptions = {}
): BridgeConnectionStore {
  const entries = new Map<string, BridgeConnectionRuntime>();
  const listeners = new Set<() => void>();
  const ctx: RefreshContext = {
    entries,
    probes: options.probes ?? SESSION_PROBES,
    bridgeIds: options.bridgeIds ?? KNOWN_BRIDGE_IDS,
    getExtensionId:
      options.getExtensionId ?? ((id) => bridgeDiscovery.getExtensionId(id)),
    now: options.now ?? (() => Date.now()),
    notify: () => listeners.forEach((listener) => listener()),
  };

  let lastRefreshAt: number | null = null;
  const refresh = async (opts: { force?: boolean } = {}) => {
    await refreshConnections(ctx, opts.force === true);
    lastRefreshAt = ctx.now();
  };

  const { start, stop } = createLifecycle({
    refresh,
    subscribeDiscovery:
      options.subscribeDiscovery ?? ((l) => bridgeDiscovery.subscribe(l)),
    lastRefreshAt: () => lastRefreshAt,
    now: ctx.now,
  });

  return {
    start,
    stop,
    refresh,
    getSnapshot: createSnapshotReader(entries, ctx.bridgeIds),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// Parked on globalThis for the same reason as `bridgeDiscovery`: a Vite hot
// update would otherwise create a second store while mounted hooks stay
// subscribed to the first one.
type GlobalWithConnections = {
  __KAIORD_BRIDGE_CONNECTIONS__?: BridgeConnectionStore;
};
const g = globalThis as unknown as GlobalWithConnections;
export const bridgeConnections: BridgeConnectionStore =
  g.__KAIORD_BRIDGE_CONNECTIONS__ ?? createBridgeConnectionStore();
g.__KAIORD_BRIDGE_CONNECTIONS__ = bridgeConnections;
