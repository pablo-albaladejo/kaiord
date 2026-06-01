/**
 * In-Memory IntegrationPolicy Repository
 *
 * Test implementation keyed by policy id. Accepts an externally-owned
 * store so `createInMemoryPersistence` can snapshot it for transaction
 * rollback. Mirrors the Dexie repository's natural-key semantics.
 */

import type { IntegrationPolicyRepository } from "../application/integration-policy/integration-policy-repository.port";
import type { IntegrationPolicy } from "../types/integration-policy";

export function createInMemoryIntegrationPolicyRepository(
  store: Map<string, IntegrationPolicy> = new Map()
): IntegrationPolicyRepository {
  return {
    findByProfileDirection: async ({ profileId, dataType, direction }) =>
      [...store.values()].filter(
        (p) =>
          p.profileId === profileId &&
          p.dataType === dataType &&
          p.direction === direction
      ),

    findByNaturalKey: async ({ profileId, dataType, direction, bridgeId }) =>
      [...store.values()].find(
        (p) =>
          p.profileId === profileId &&
          p.dataType === dataType &&
          p.direction === direction &&
          p.bridgeId === bridgeId
      ),

    put: async (policy) => {
      store.set(policy.id, policy);
    },

    deleteById: async (id) => {
      store.delete(id);
    },
  };
}
