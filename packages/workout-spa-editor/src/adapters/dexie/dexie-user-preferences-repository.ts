/**
 * Dexie UserPreferencesRepository
 *
 * Single-table adapter keyed by `profileId`. Cross-table cascade on
 * profile delete is orchestrated by the application-layer `deleteProfile`
 * use case, which calls `delete(profileId)` inside the wrapping transaction.
 */

import type { UserPreferencesRepository } from "../../ports/user-preferences-repository";
import type { UserPreferences } from "../../types/user-preferences";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieUserPreferencesRepository(
  db: KaiordDatabase
): UserPreferencesRepository {
  const table = () => db.table<UserPreferences>("userPreferences");

  return {
    get: async (profileId) => {
      const result = await table().get(profileId);
      return result ?? undefined;
    },
    put: async (prefs) => {
      await table().put(prefs);
    },
    delete: async (profileId) => {
      await table().delete(profileId);
    },
  };
}
