/**
 * Lazy CloudSyncPort
 *
 * Defers loading the real cloud-sync adapter (Google Drive REST, GIS auth,
 * snapshot cipher) until sync is first used, so none of it sits in the
 * SPA's initial JS. The GIS token lives only in memory for the session, so
 * before the adapter has loaded nobody can be authenticated:
 * `isAuthenticated()` answers `false` exactly as the eager adapter would.
 * A failed load is not cached; the next call retries.
 */

import type { CloudSyncPort } from "../../ports/cloud-sync-port";

export function createLazyCloudSync(
  load: () => Promise<CloudSyncPort>
): CloudSyncPort {
  let port: CloudSyncPort | null = null;
  let pending: Promise<CloudSyncPort> | null = null;

  const get = (): Promise<CloudSyncPort> => {
    pending ??= load().then(
      (loaded) => (port = loaded),
      (error: unknown) => {
        pending = null;
        throw error;
      }
    );
    return pending;
  };

  return {
    isAuthenticated: () => port?.isAuthenticated() ?? false,
    authenticate: async () => (await get()).authenticate(),
    pull: async () => (await get()).pull(),
    push: async (snapshot, expectedRevision) =>
      (await get()).push(snapshot, expectedRevision),
  };
}
