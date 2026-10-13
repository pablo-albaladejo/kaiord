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
    | "calendarView"
    | "lastScratchSport"
    | "activeSport"
    | "aiBannerExpanded"
    | "labDashboardParams"
    | "setupChecklistDismissed"
    | "dismissedCoachMarks"
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
    activeSport: existing?.activeSport,
    aiBannerExpanded: existing?.aiBannerExpanded,
    // Legacy: units, locale and notifications moved to the device
    // (lib/device-preferences). Kept as-is so older devices syncing the
    // same snapshot still read the values they wrote.
    units: existing?.units,
    notificationsEnabled: existing?.notificationsEnabled,
    labDashboardParams: existing?.labDashboardParams,
    locale: existing?.locale,
    setupChecklistDismissed: existing?.setupChecklistDismissed,
    dismissedCoachMarks: existing?.dismissedCoachMarks,
    ...input.patch,
    updatedAt: deps.clock(),
  };
  await deps.repository.put(next);
}
