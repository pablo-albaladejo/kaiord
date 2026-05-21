/**
 * UserPreferencesRepository port — per-profile UI preferences (calendar
 * view, future expansions). Rows are created lazily on first user-driven
 * mutation; absence of a row is the canonical "no overrides" state and is
 * surfaced as `undefined` from `get`.
 */

import type { UserPreferences } from "../types/user-preferences";

export type UserPreferencesRepository = {
  get: (profileId: string) => Promise<UserPreferences | undefined>;
  put: (prefs: UserPreferences) => Promise<void>;
  /** No-op when the row does not exist. Cascade hook on profile delete. */
  delete: (profileId: string) => Promise<void>;
};
