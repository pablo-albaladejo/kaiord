/**
 * useProfileCRUD Hook
 *
 * Combines create, update, delete operations.
 */

import { useProfileCreate } from "./useProfileCreate";
import { useProfileDelete } from "./useProfileDelete";
import { useProfileEdit } from "./useProfileEdit";
import type { Profile } from "../../../../types/profile";

type ProfileFormData = {
  name: string;
  bodyWeight?: number;
  ftp?: number;
  maxHeartRate?: number;
};

type UseProfileCRUDParams = {
  createProfile: (
    name: string,
    data: {
      bodyWeight?: number;
      ftp?: number;
      maxHeartRate?: number;
    }
  ) => void;
  updateProfile: (
    id: string,
    data: {
      name?: string;
      bodyWeight?: number;
      ftp?: number;
      maxHeartRate?: number;
    }
  ) => void;
  deleteProfile: (id: string) => void;
  formData: ProfileFormData;
  editingProfile: Profile | null;
  setFormData: (data: ProfileFormData) => void;
  setEditingProfile: (profile: Profile | null) => void;
  setDeleteConfirmId: (id: string | null) => void;
};

export function useProfileCRUD(params: UseProfileCRUDParams) {
  const create = useProfileCreate({
    createProfile: params.createProfile,
    formData: params.formData,
    setFormData: params.setFormData,
  });

  const edit = useProfileEdit({
    updateProfile: params.updateProfile,
    formData: params.formData,
    editingProfile: params.editingProfile,
    setFormData: params.setFormData,
    setEditingProfile: params.setEditingProfile,
  });

  const deleteOps = useProfileDelete({
    deleteProfile: params.deleteProfile,
    setDeleteConfirmId: params.setDeleteConfirmId,
  });

  return {
    ...create,
    ...edit,
    ...deleteOps,
  };
}
