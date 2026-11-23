import type { CapabilityDecisionRepository } from "../../ports/capability-decision-repository";
import type { CapabilityDecision } from "../../types/capability-decision";
import type { KaiordDatabase } from "./dexie-database";

/** The v40 `capabilityDecisions` store, one row per (profile, Capability). */
export const createDexieCapabilityDecisionRepository = (
  db: KaiordDatabase
): CapabilityDecisionRepository => {
  const table = () => db.table<CapabilityDecision>("capabilityDecisions");
  return {
    listByProfile: (profileId) =>
      table().where("profileId").equals(profileId).toArray(),
    put: async (decision) => {
      await table().put(decision);
    },
    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
};
