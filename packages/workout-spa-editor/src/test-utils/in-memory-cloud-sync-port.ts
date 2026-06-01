/**
 * In-Memory CloudSyncPort
 *
 * Test fake mirroring a remote snapshot store: holds at most one snapshot
 * and a monotonic revision, enforcing the same optimistic-concurrency
 * contract the Drive adapter does (a push with a stale `expectedRevision`
 * is rejected). Lets `syncWithCloud` be exercised without any network.
 */

import type { RemoteSnapshot, Snapshot } from "../types/snapshot";
import type { CloudSyncPort } from "../ports/cloud-sync-port";

export type InMemoryCloudSyncState = {
  authenticated: boolean;
  snapshot: Snapshot | null;
  revision: string | null;
  pushCount: number;
};

export function createInMemoryCloudSyncPort(
  state: InMemoryCloudSyncState = {
    authenticated: false,
    snapshot: null,
    revision: null,
    pushCount: 0,
  }
): CloudSyncPort & { state: InMemoryCloudSyncState } {
  const port: CloudSyncPort = {
    isAuthenticated: () => state.authenticated,

    authenticate: async () => {
      state.authenticated = true;
    },

    pull: async (): Promise<RemoteSnapshot | null> => {
      if (state.snapshot === null || state.revision === null) return null;
      return { snapshot: state.snapshot, headRevisionId: state.revision };
    },

    push: async (snapshot, expectedRevision) => {
      if (expectedRevision !== state.revision) {
        throw new Error(
          `cloud-sync revision conflict: expected ${expectedRevision}, ` +
            `current ${state.revision}`
        );
      }
      state.pushCount += 1;
      state.snapshot = snapshot;
      state.revision = `rev-${state.pushCount}`;
      return state.revision;
    },
  };

  return Object.assign(port, { state });
}
