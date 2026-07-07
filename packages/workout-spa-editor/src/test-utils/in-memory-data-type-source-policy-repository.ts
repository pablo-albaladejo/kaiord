import type { DataTypeSourcePolicyRepository } from "../application/data-source-policy/data-type-source-policy-repository.port";
import type { DataTypeSourcePolicy } from "../types/data-type-source-policy";

/**
 * In-memory DataTypeSourcePolicyRepository for tests. Keyed by the same
 * natural key as the Dexie adapter's `[profileId+dataType]` index.
 */
export const createInMemoryDataTypeSourcePolicyRepository = (
  store: Map<string, DataTypeSourcePolicy> = new Map()
): DataTypeSourcePolicyRepository => ({
  findByProfileAndType: async ({ profileId, dataType }) =>
    store.get(`${profileId}:${dataType}`),
  put: async (policy: DataTypeSourcePolicy) => {
    store.set(`${policy.profileId}:${policy.dataType}`, policy);
  },
  deleteByProfile: async (profileId: string) => {
    for (const key of store.keys()) {
      if (key.startsWith(`${profileId}:`)) store.delete(key);
    }
  },
});
