/**
 * useProfileDelete Hook
 *
 * Profile deletion logic.
 */

type UseProfileDeleteParams = {
  deleteProfile: (id: string) => void;
  setDeleteConfirmId: (id: string | null) => void;
};

export function useProfileDelete(params: UseProfileDeleteParams) {
  const { deleteProfile, setDeleteConfirmId } = params;

  const handleDelete = (profileId: string) => {
    setDeleteConfirmId(profileId);
  };

  const confirmDelete = (deleteConfirmId: string | null) => {
    if (deleteConfirmId) {
      deleteProfile(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return {
    handleDelete,
    confirmDelete,
  };
}
