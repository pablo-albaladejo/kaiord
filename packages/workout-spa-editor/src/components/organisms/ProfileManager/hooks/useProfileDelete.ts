/**
 * useProfileDelete Hook
 *
 * Profile deletion with coaching cascade. The cascade runs BEFORE the
 * profile row is removed via `deleteProfile` so a subsequent reload
 * doesn't see orphan coaching rows. `deletedProfileId` is captured at
 * confirm time — NEVER `getActiveId()` (would race when deleting a
 * non-active profile or right after a switch).
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
        await deleteProfileWithCascade(
          {
            coaching: persistence.coaching,
            coachingSyncState: persistence.coachingSyncState,
          },
          id
        );
        await deleteProfile(persistence, id);
        setDeleteConfirmId(null);
      } catch {
        toast.error(TOAST_ERROR);
        // Keep the confirm dialog open so the user can retry.
      }
    })();
  };

  return { handleDelete, confirmDelete };
}
