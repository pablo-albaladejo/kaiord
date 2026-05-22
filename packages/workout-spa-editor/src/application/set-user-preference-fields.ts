/**
 * setUserPreferenceFields — partial upsert of the per-profile
 * UserPreferences row. Merges the requested fields onto the existing
 * row (or the default shape when no row exists yet) and rewrites
 * `updatedAt` from the injected clock.
 *
 * Profile existence is verified before the write so a concurrent
 * profile delete surfaces as `ProfileNotFoundError` rather than
 * silently leaving an orphan row — same sequencing as `setCalendarView`.
 */

import type { ProfileRepository } from "../ports/persistence-port";
import type { UserPreferencesRepository } from "../ports/user-preferences-repository";
import { ProfileNotFoundError } from "../types/session-match-errors";
import type { UserPreferences } from "../types/user-preferences";

export type UserPreferenceFieldsPatch = Partial<
  Pick<
    UserPreferences,
    "calendarView" | "lastScratchSport" | "aiBannerExpanded"
  >
>;

export type SetUserPreferenceFieldsInput = {
  profileId: string;
  patch: UserPreferenceFieldsPatch;
};

export type SetUserPreferenceFieldsDeps = {
  clock: () => string;
  repository: UserPreferencesRepository;
  profileRepository: ProfileRepository;
};

export async function setUserPreferenceFields(
  input: SetUserPreferenceFieldsInput,
  deps: SetUserPreferenceFieldsDeps
): Promise<void> {
  const profile = await deps.profileRepository.getById(input.profileId);
  if (!profile) {
    throw new ProfileNotFoundError(input.profileId);
  }
  const existing = await deps.repository.get(input.profileId);
  const next: UserPreferences = {
    profileId: input.profileId,
    calendarView: existing?.calendarView ?? "grid",
    lastScratchSport: existing?.lastScratchSport,
    aiBannerExpanded: existing?.aiBannerExpanded,
    ...input.patch,
    updatedAt: deps.clock(),
  };
  await deps.repository.put(next);
}
