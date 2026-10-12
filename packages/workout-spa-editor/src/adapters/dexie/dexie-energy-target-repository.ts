import type { EnergyTargetRepository } from "../../ports/energy-balance-repositories";
import type { EnergyTargetRecord } from "../../types/energy-target-record";
import type { KaiordDatabase } from "./dexie-database";

// Keyed by `profileId`: `delete` (tombstoned by the decorator) and the
// cascade's `deleteByProfile` remove the same single row.
export const createEnergyTargetRepository = (
  db: KaiordDatabase
): EnergyTargetRepository => {
  const get = async (profileId: string) =>
    (await db.table("energyTargets").get(profileId)) as
      EnergyTargetRecord | undefined;
  const remove = async (profileId: string) => {
    await db.table("energyTargets").delete(profileId);
  };
  return {
    get,
    getById: get,
    put: async (record) => {
      await db.table("energyTargets").put(record);
    },
    delete: remove,
    deleteByProfile: remove,
  };
};
