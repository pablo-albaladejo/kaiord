/**
 * In-Memory UserPreferencesRepository — keyed by `profileId`.
 *
 * Mirrors the Dexie adapter's "absent row means defaults" semantic:
 * `get` returns `undefined`, never a synthesized row.
 */

import type { UserPreferencesRepository } from "../ports/user-preferences-repository";
import type { UserPreferences } from "../types/user-preferences";

type Store = Map<string, UserPreferences>;

export function createInMemoryUserPreferencesRepository(
  store: Store = new Map()
): UserPreferencesRepository {
  return {
    get: async (profileId) => store.get(profileId),
    put: async (prefs) => {
      store.set(prefs.profileId, prefs);
    },
    delete: async (profileId) => {
      store.delete(profileId);
    },
  };
}
