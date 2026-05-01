/**
 * setCalendarDensity — upserts the per-profile UserPreferences row.
 *
 * The profile-existence read is sequenced before the write so a
 * concurrent profile delete surfaces as `ProfileNotFoundError` rather
 * than silently leaving an orphan row. The Dexie adapter wraps both
 * operations in a single `rw` transaction; the in-memory test double
 * inherits the same sequencing.
 */

import type { ProfileRepository } from "../ports/persistence-port";
import type { UserPreferencesRepository } from "../ports/user-preferences-repository";
import { ProfileNotFoundError } from "../types/session-match-errors";
import type { CalendarDensity } from "../types/user-preferences";

export type SetCalendarDensityInput = {
  profileId: string;
  density: CalendarDensity;
};

export type SetCalendarDensityDeps = {
  clock: () => string;
  repository: UserPreferencesRepository;
  profileRepository: ProfileRepository;
};

export async function setCalendarDensity(
  input: SetCalendarDensityInput,
  deps: SetCalendarDensityDeps
): Promise<void> {
  const profile = await deps.profileRepository.getById(input.profileId);
  if (!profile) {
    throw new ProfileNotFoundError(input.profileId);
  }
  await deps.repository.put({
    profileId: input.profileId,
    calendarDensity: input.density,
    updatedAt: deps.clock(),
  });
}
