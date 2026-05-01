/**
 * Dexie AutoMatchDismissalRepository
 *
 * Composite primary key `[profileId+weekStart]`; secondary index on
 * `profileId` for the cascade hook on profile delete.
 */

import type { AutoMatchDismissalRepository } from "../../ports/auto-match-dismissal-repository";
import type { AutoMatchDismissal } from "../../types/auto-match-dismissal";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieAutoMatchDismissalRepository(
  db: KaiordDatabase
): AutoMatchDismissalRepository {
  const table = () => db.table<AutoMatchDismissal>("autoMatchDismissals");

  return {
    getByProfileAndWeek: async (profileId, weekStart) => {
      const result = await table().get([profileId, weekStart]);
      return result ?? undefined;
    },
    put: async (dismissal) => {
      await table().put(dismissal);
    },
    delete: async (profileId, weekStart) => {
      await table().delete([profileId, weekStart]);
    },
    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
}
