/**
 * Dexie AutoMatchDismissalRepository
 *
 * Composite primary key `[profileId+weekStart]`; secondary index on
 * `profileId` for the cascade hook on profile delete. Row shape is
 * the per-pair model from design D15 of
 * calendar-coaching-redesign-completion: `{ profileId, weekStart,
 * dismissedPairs: Array<{ activityId, workoutId, dismissedAt }> }`.
 *
 * The adapter is single-shape — it never reads or writes the prior
 * single-timestamp form. The Dexie schema migration that introduces
 * the new shape clears the table forward-only so no row of the old
 * shape ever reaches this adapter (autoMatchDismissals is UX-state
 * cache, not user data; losing it on upgrade is acceptable).
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
      const row = await table().get([profileId, weekStart]);
      return row ?? undefined;
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
