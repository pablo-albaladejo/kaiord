/**
 * setUserPreferenceFields — partial upsert of the per-profile
 * UserPreferences row. Merges the requested fields onto the whole existing
 * row, every field kept including those this build does not know (or the
 * default shape when no row exists yet), and rewrites `updatedAt` from the
 * injected clock.
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
    | "calendarView"
    | "lastScratchSport"
    | "activeSport"
    | "aiBannerExpanded"
    | "labDashboardParams"
    | "setupChecklistDismissed"
    | "dismissedCoachMarks"
    | "authorityDeciders"
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
  // The whole existing row first: a field this build does not know (one a
  // newer build wrote) is carried over rather than dropped.
  const next: UserPreferences = {
    ...existing,
    profileId: input.profileId,
    calendarView: existing?.calendarView ?? "grid",
    ...input.patch,
    updatedAt: deps.clock(),
  };
  await deps.repository.put(next);
}
