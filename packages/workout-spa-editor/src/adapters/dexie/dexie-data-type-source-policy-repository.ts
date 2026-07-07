/**
 * Dexie implementation of DataTypeSourcePolicyRepository.
 *
 * Uses the v30 `dataTypeSourcePolicy` store, keyed by the compound
 * primary key `[profileId+dataType]` — one row per type per profile.
 */
import type { DataTypeSourcePolicyRepository } from "../../application/data-source-policy/data-type-source-policy-repository.port";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { KaiordDatabase } from "./dexie-database";

export const createDexieDataTypeSourcePolicyRepository = (
  db: KaiordDatabase
): DataTypeSourcePolicyRepository => ({
  findByProfileAndType: async ({ profileId, dataType }) =>
    (await db
      .table("dataTypeSourcePolicy")
      .where("[profileId+dataType]")
      .equals([profileId, dataType])
      .first()) as DataTypeSourcePolicy | undefined,

  put: async (policy: DataTypeSourcePolicy) => {
    await db.table("dataTypeSourcePolicy").put(policy);
  },

  deleteByProfile: async (profileId: string) => {
    await db
      .table("dataTypeSourcePolicy")
      .where("profileId")
      .equals(profileId)
      .delete();
  },
});
