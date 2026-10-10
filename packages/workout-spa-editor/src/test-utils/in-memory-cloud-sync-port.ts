/**
 * In-Memory CloudSyncPort
 *
 * Test fake mirroring a remote snapshot store: holds at most one snapshot
 * and a monotonic revision, enforcing the same optimistic-concurrency
 * contract the Drive adapter does (a push with a stale `expectedRevision`
 * is rejected). Lets `syncWithCloud` be exercised without any network.
 *
 * It also enforces the default-profile invariant for every sync test: a
 * pushed snapshot carrying an `origin: "auto"` profile is rejected loudly,
 * so a regression cannot pass any test that pushes through this fake.
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
      // An encrypted envelope carries no plaintext tables; the invariant is
      // asserted on the plaintext snapshot by the layer that encrypts it.
      const tables = snapshot.tables as typeof snapshot.tables | undefined;
      const profiles = (tables?.profiles ?? []) as Array<{
        origin?: unknown;
      }>;
      if (profiles.some((p) => p.origin === "auto")) {
        throw new Error("invariant: an origin:auto profile reached cloud.push");
      }
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
