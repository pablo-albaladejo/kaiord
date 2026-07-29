/**
 * useBridgeConnections — one reactive row per known bridge, merging the
 * in-memory connection store with the persisted `coachingSyncState`
 * freshness timestamps.
 *
 * `coachingSyncState`'s primary key is `[source+profileId]` and there is no
 * `profileId` index, so N point-gets inside ONE `useLiveQuery` is the correct
 * shape — a table scan or one query per bridge would both be worse.
 */
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useSyncExternalStore } from "react";

import { bridgeConnections } from "../adapters/bridge/bridge-connection-store";
import type {
  BridgeConnectionRuntime,
  BridgeConnectionState,
} from "../adapters/bridge/bridge-connection-types";
import {
  byBridgeId,
  readBridgeSyncStates,
} from "../application/data-hub/read-bridge-sync-states";
import { usePersistence } from "../contexts/persistence-context";

export type { BridgeConnectionState };

type LastSyncMap = ReadonlyMap<string, string | undefined>;

const EMPTY_RUNTIME: readonly BridgeConnectionRuntime[] = [];
const EMPTY_SYNCS: LastSyncMap = new Map();

const subscribe = (listener: () => void) =>
  bridgeConnections.subscribe(listener);
const getSnapshot = () => bridgeConnections.getSnapshot();
const getServerSnapshot = () => EMPTY_RUNTIME;
const getRefreshed = () => bridgeConnections.hasRefreshed();
const getServerRefreshed = () => false;

/**
 * Whether the store has completed a pass. Every row reads undiscovered until
 * it has — because nothing has been asked yet, not because nothing is there —
 * so a surface that counts rows must wait for this.
 */
export const useBridgeConnectionsRefreshed = (): boolean =>
  useSyncExternalStore(subscribe, getRefreshed, getServerRefreshed);

export const useBridgeConnections = (
  profileId: string | null
): readonly BridgeConnectionState[] => {
  const persistence = usePersistence();
  const runtime = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const lastSyncs = useLiveQuery(
    () =>
      profileId
        ? readBridgeSyncStates(persistence.coachingSyncState, profileId).then(
            byBridgeId
          )
        : Promise.resolve(EMPTY_SYNCS),
    [persistence, profileId]
  );

  return useMemo(
    () =>
      runtime.map((entry) => ({
        ...entry,
        lastSyncAt: lastSyncs?.get(entry.bridgeId),
      })),
    [runtime, lastSyncs]
  );
};
