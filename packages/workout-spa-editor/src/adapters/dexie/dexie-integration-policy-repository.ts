/**
 * Dexie implementation of IntegrationPolicyRepository.
 *
 * Uses the v17 integrationPolicies store. All compound-index queries
 * are expressed as Dexie where().equals() calls; no raw SQL.
 */
import type { IntegrationPolicyRepository } from "../../application/integration-policy/integration-policy-repository.port";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { KaiordDatabase } from "./dexie-database";

export const createDexieIntegrationPolicyRepository = (
  db: KaiordDatabase
): IntegrationPolicyRepository => ({
  findByProfileDirection: async ({ profileId, dataType, direction }) =>
    (await db
      .table("integrationPolicies")
      .where("[profileId+dataType+direction]")
      .equals([profileId, dataType, direction])
      .toArray()) as IntegrationPolicy[],

  findByNaturalKey: async ({ profileId, dataType, direction, bridgeId }) =>
    (await db
      .table("integrationPolicies")
      .where("[profileId+dataType+direction+bridgeId]")
      .equals([profileId, dataType, direction, bridgeId])
      .first()) as IntegrationPolicy | undefined,

  put: async (policy: IntegrationPolicy) => {
    await db.table("integrationPolicies").put(policy);
  },

  deleteById: async (id: string) => {
    await db.table("integrationPolicies").delete(id);
  },
});

export type { IntegrationPolicyRepository };
