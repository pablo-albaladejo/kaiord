/**
 * useProfileCRUD Hook
 *
 * Combines create, update, delete operations. After Phase 1B each leaf
 * hook pulls `usePersistence()` directly so this orchestrator no longer
 * threads Zustand-store actions through its parameter list.
 */

import type { Profile } from "../../../../types/profile";
import type { ProfileFormData } from "../types";
import { useProfileCreate } from "./useProfileCreate";
import { useProfileDelete } from "./useProfileDelete";
import { useProfileEdit } from "./useProfileEdit";

type UseProfileCRUDParams = {
  formData: ProfileFormData;
  editingProfile: Profile | null;
  setFormData: (data: ProfileFormData) => void;
  setEditingProfile: (profile: Profile | null) => void;
  setDeleteConfirmId: (id: string | null) => void;
};

export function useProfileCRUD(params: UseProfileCRUDParams) {
  const create = useProfileCreate({
    formData: params.formData,
    setFormData: params.setFormData,
  });

  const edit = useProfileEdit({
    formData: params.formData,
    editingProfile: params.editingProfile,
    setFormData: params.setFormData,
    setEditingProfile: params.setEditingProfile,
  });

  const deleteOps = useProfileDelete({
    setDeleteConfirmId: params.setDeleteConfirmId,
  });

  return { ...create, ...edit, ...deleteOps };
}
