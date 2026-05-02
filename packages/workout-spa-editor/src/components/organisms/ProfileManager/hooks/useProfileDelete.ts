/**
 * useProfileDelete Hook
 *
 * Profile deletion with full cascade fan-out. The cascade clears all
 * profile-scoped persistence (coaching activities, coaching sync state,
 * session matches, auto-match dismissals, user preferences) BEFORE the
 * profile row itself is removed via `deleteProfile`. The whole flow runs
 * inside `persistence.transaction(...)` so a mid-cascade crash leaves the
 * database in the pre-delete state. `deletedProfileId` is captured at
 * confirm time — NEVER `getActiveId()` (would race when deleting a
 * non-active profile or right after a switch).
 */

import { createDexieAutoMatchDismissalRepository } from "../../../../adapters/dexie/dexie-auto-match-dismissal-repository";
import { db } from "../../../../adapters/dexie/dexie-database";
import { createDexieSessionMatchRepository } from "../../../../adapters/dexie/dexie-session-match-repository";
import { createDexieUserPreferencesRepository } from "../../../../adapters/dexie/dexie-user-preferences-repository";
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
        // The cascade and the profile delete share one transaction so a
        // mid-fan-out crash leaves the DB in the pre-delete state. The
        // auxiliary repos use the same `db` instance, so Dexie's
        // zone-tracked transaction picks them up alongside the
        // PersistencePort-routed repos.
        await persistence.transaction(async () => {
          await deleteProfileWithCascade(
            {
              coaching: persistence.coaching,
              coachingSyncState: persistence.coachingSyncState,
              sessionMatch: createDexieSessionMatchRepository(db),
              autoMatchDismissal: createDexieAutoMatchDismissalRepository(db),
              userPreferences: createDexieUserPreferencesRepository(db),
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
