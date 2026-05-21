/**
 * Reads the persisted UserPreferences row, falling back to a synthesised
 * default when no row exists. The default is NOT written; the application
 * layer treats absence as the canonical "no override" state.
 *
 * `defaultView` is computed by the caller (UI layer reads viewport
 * width); the application layer is viewport-agnostic.
 */

import type { UserPreferencesRepository } from "../ports/user-preferences-repository";
import type { CalendarView, UserPreferences } from "../types/user-preferences";

export type GetUserPreferencesInput = {
  profileId: string;
  defaultView?: CalendarView;
};

export type GetUserPreferencesDeps = {
  repository: UserPreferencesRepository;
  clock: () => string;
};

export async function getUserPreferences(
  input: GetUserPreferencesInput,
  deps: GetUserPreferencesDeps
): Promise<UserPreferences> {
  const persisted = await deps.repository.get(input.profileId);
  if (persisted) return persisted;
  return {
    profileId: input.profileId,
    calendarView: input.defaultView ?? "grid",
    updatedAt: deps.clock(),
  };
}
