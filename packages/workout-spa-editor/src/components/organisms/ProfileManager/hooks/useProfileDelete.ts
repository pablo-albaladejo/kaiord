/**
 * useProfileDelete Hook
 *
 * Profile deletion with full cascade fan-out. The cascade clears all
 * profile-scoped persistence (workouts, coaching activities, coaching
 * sync state, session matches, auto-match dismissals, user preferences)
 * BEFORE the profile row itself is removed via `deleteProfile`. The
 * whole flow runs
 * inside `persistence.transaction(...)` so a mid-cascade crash leaves the
 * database in the pre-delete state. `deletedProfileId` is captured at
 * confirm time — NEVER `getActiveId()` (would race when deleting a
 * non-active profile or right after a switch).
 *
 * Every cascade repository is sourced from the injected `persistence`
 * object (not from any direct `db` import) so the outer transaction
 * binds cleanly to the same database instance and a different
 * `PersistencePort` cannot accidentally split writes.
 */

import { deleteProfile } from "../../../../application/profile/delete-profile";
import { deleteProfileWithCascade } from "../../../../application/profile/delete-profile-with-cascade";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";

type UseProfileDeleteParams = {
  setDeleteConfirmId: (id: string | null) => void;
};

const TOAST_ERROR = "Failed to delete profile — please retry.";

export function useProfileDelete(params: UseProfileDeleteParams) {
  const { setDeleteConfirmId } = params;
  const persistence = usePersistence();
  const toast = useToastContext();

  const handleDelete = (profileId: string) => {
    setDeleteConfirmId(profileId);
  };

  const confirmDelete = (deleteConfirmId: string | null) => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId; // capture; never use getActiveId
    void (async () => {
      try {
        await persistence.transaction(async () => {
          await deleteProfileWithCascade(
            {
              workouts: persistence.workouts,
              coaching: persistence.coaching,
              coachingSyncState: persistence.coachingSyncState,
              sessionMatch: persistence.sessionMatch,
              autoMatchDismissal: persistence.autoMatchDismissal,
              userPreferences: persistence.userPreferences,
            },
            id
          );
          await deleteProfile(persistence, id);
        });
        setDeleteConfirmId(null);
      } catch {
        toast.error(TOAST_ERROR);
        // Keep the confirm dialog open so the user can retry.
      }
    })();
  };

  return { handleDelete, confirmDelete };
}
