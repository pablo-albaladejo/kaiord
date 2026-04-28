/**
 * useProfileDelete Hook
 *
 * Profile deletion with coaching cascade. The cascade runs BEFORE the
 * Zustand store action removes the profile row, so a subsequent reload
 * doesn't see orphan coaching rows. deletedProfileId is captured at
 * confirm time — NEVER `getActiveId()` (would race when deleting a
 * non-active profile or right after a switch).
 */

import { deleteProfileWithCascade } from "../../../../application/profile/delete-profile-with-cascade";
import { usePersistence } from "../../../../contexts/persistence-context";

type UseProfileDeleteParams = {
  deleteProfile: (id: string) => void;
  setDeleteConfirmId: (id: string | null) => void;
};

export function useProfileDelete(params: UseProfileDeleteParams) {
  const { deleteProfile, setDeleteConfirmId } = params;
  const persistence = usePersistence();

  const handleDelete = (profileId: string) => {
    setDeleteConfirmId(profileId);
  };

  const confirmDelete = (deleteConfirmId: string | null) => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId; // capture; never use getActiveId
    void (async () => {
      await deleteProfileWithCascade(
        {
          coaching: persistence.coaching,
          coachingSyncState: persistence.coachingSyncState,
        },
        id
      );
      deleteProfile(id);
      setDeleteConfirmId(null);
    })();
  };

  return {
    handleDelete,
    confirmDelete,
  };
}
