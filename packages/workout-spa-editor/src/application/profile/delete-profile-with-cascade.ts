/**
 * deleteProfileWithCascade — application use case
 *
 * Cleans up profile-scoped persistence rows BEFORE the profile row itself
 * is removed by `deleteProfile`. The id passed MUST be the function
 * argument's `deletedProfileId` — NEVER `getActiveId()` (would race when
 * deleting a non-active profile or right after a switch).
 *
 * The cascade covers every per-profile repository: coaching activities,
 * coaching sync state, session matches, auto-match dismissals, and user
 * preferences. Each repository's deletion method is called once with the
 * deleted profile id.
 *
 * Profile-agnostic data (workouts, templates, AI providers, usage, sync
 * state, meta) is NOT cascaded — those rows are user-owned across profile
 * boundaries by design (per spec "Profile delete preserves converted
 * workouts" and "AI providers are profile-agnostic").
 *
 * Atomicity: this use case does NOT open its own transaction. The caller
 * MUST wrap both this call and the subsequent `deleteProfile` invocation
 * in a single `persistence.transaction(...)` so a mid-cascade crash leaves
 * the database in the pre-delete state. See `useProfileDelete` for the
 * canonical orchestration.
 */

import type { AutoMatchDismissalRepository } from "../../ports/auto-match-dismissal-repository";
import type {
  CoachingRepository,
  CoachingSyncStateRepository,
} from "../../ports/persistence-port";
import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { UserPreferencesRepository } from "../../ports/user-preferences-repository";

export type DeleteProfileWithCascadeDeps = {
  coaching: CoachingRepository;
  coachingSyncState: CoachingSyncStateRepository;
  sessionMatch: SessionMatchRepository;
  autoMatchDismissal: AutoMatchDismissalRepository;
  userPreferences: UserPreferencesRepository;
};

export const deleteProfileWithCascade = async (
  deps: DeleteProfileWithCascadeDeps,
  deletedProfileId: string
): Promise<void> => {
  await Promise.all([
    deps.coaching.deleteByProfile(deletedProfileId),
    deps.coachingSyncState.deleteByProfile(deletedProfileId),
    deps.sessionMatch.deleteByProfile(deletedProfileId),
    deps.autoMatchDismissal.deleteByProfile(deletedProfileId),
    deps.userPreferences.delete(deletedProfileId),
  ]);
};
