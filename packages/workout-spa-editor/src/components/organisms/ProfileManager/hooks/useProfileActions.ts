/**
 * useProfileActions Hook
 *
 * Combines all profile actions.
 */

import { useProfileCRUD } from "./useProfileCRUD";
import { useProfileSwitch } from "./useProfileSwitch";
import type { Profile } from "../../../../types/profile";

type ProfileFormData = {
  name: string;
  bodyWeight?: number;
  ftp?: number;
  maxHeartRate?: number;
};

type UseProfileActionsParams = {
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
  setActiveProfile: (id: string) => void;
  profiles: Array<Profile>;
  formData: ProfileFormData;
  editingProfile: Profile | null;
  setFormData: (data: ProfileFormData) => void;
  setEditingProfile: (profile: Profile | null) => void;
  setDeleteConfirmId: (id: string | null) => void;
  setSwitchNotification: (message: string | null) => void;
};

export function useProfileActions(params: UseProfileActionsParams) {
  const crud = useProfileCRUD({
    createProfile: params.createProfile,
    updateProfile: params.updateProfile,
    deleteProfile: params.deleteProfile,
    formData: params.formData,
    editingProfile: params.editingProfile,
    setFormData: params.setFormData,
    setEditingProfile: params.setEditingProfile,
    setDeleteConfirmId: params.setDeleteConfirmId,
  });

  const switcher = useProfileSwitch({
    setActiveProfile: params.setActiveProfile,
    profiles: params.profiles,
    setSwitchNotification: params.setSwitchNotification,
  });

  return {
    ...crud,
    ...switcher,
  };
}
