/**
 * deleteProfileWithCascade — application use case
 *
 * Cleans up profile-scoped coaching data (coachingActivities and
 * coachingSyncState) BEFORE the profile row itself is removed by the
 * Zustand store action. The id passed MUST be the function argument's
 * `deletedProfileId` — NEVER `getActiveId()` (would race when deleting
 * a non-active profile or right after a switch).
 *
 * Converted WorkoutRecord rows are NOT cascaded — workouts are
 * profile-agnostic today and survive profile deletion (per spec
 * "Profile delete preserves converted workouts").
 */

import type {
  CoachingRepository,
  CoachingSyncStateRepository,
} from "../../ports/persistence-port";

export type DeleteProfileWithCascadeDeps = {
  coaching: CoachingRepository;
  coachingSyncState: CoachingSyncStateRepository;
};

export const deleteProfileWithCascade = async (
  deps: DeleteProfileWithCascadeDeps,
  deletedProfileId: string
): Promise<void> => {
  await Promise.all([
    deps.coaching.deleteByProfile(deletedProfileId),
    deps.coachingSyncState.deleteByProfile(deletedProfileId),
  ]);
};
