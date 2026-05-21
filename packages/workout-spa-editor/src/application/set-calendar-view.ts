/**
 * setCalendarView — upserts the per-profile UserPreferences row.
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
import type { CalendarView } from "../types/user-preferences";

export type SetCalendarViewInput = {
  profileId: string;
  view: CalendarView;
};

export type SetCalendarViewDeps = {
  clock: () => string;
  repository: UserPreferencesRepository;
  profileRepository: ProfileRepository;
};

export async function setCalendarView(
  input: SetCalendarViewInput,
  deps: SetCalendarViewDeps
): Promise<void> {
  const profile = await deps.profileRepository.getById(input.profileId);
  if (!profile) {
    throw new ProfileNotFoundError(input.profileId);
  }
  await deps.repository.put({
    profileId: input.profileId,
    calendarView: input.view,
    updatedAt: deps.clock(),
  });
}
