/**
 * In-memory ConnectionRepository for app-layer tests. Mirrors the Dexie
 * adapter's contract so the two stay observationally equivalent.
 */
import type { ConnectionRepository } from "../application/connections/connection-repository.port";
import type { ConnectionRecord } from "../types/connection";

const key = (profileId: string, providerId: string): string =>
  `${profileId}:${providerId}`;

export const createInMemoryConnectionRepository = (
  store: Map<string, ConnectionRecord> = new Map()
): ConnectionRepository => ({
  getByProfile: async (profileId) =>
    [...store.values()].filter((record) => record.profileId === profileId),

  get: async (profileId, providerId) => store.get(key(profileId, providerId)),

  put: async (record) => {
    store.set(key(record.profileId, record.providerId), record);
  },

  delete: async (profileId, providerId) => {
    store.delete(key(profileId, providerId));
  },

  deleteByProfile: async (profileId) => {
    for (const [mapKey, record] of store) {
      if (record.profileId === profileId) store.delete(mapKey);
    }
  },
});
