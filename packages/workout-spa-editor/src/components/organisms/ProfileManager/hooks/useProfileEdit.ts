/**
 * useProfileEdit Hook
 *
 * Profile editing logic.
 */

import type { Profile } from "../../../../types/profile";
import type { ProfileFormData } from "../types";

type UseProfileEditParams = {
  updateProfile: (
    id: string,
    data: { name?: string; bodyWeight?: number }
  ) => void;
  formData: ProfileFormData;
  editingProfile: Profile | null;
  setFormData: (data: ProfileFormData) => void;
  setEditingProfile: (profile: Profile | null) => void;
};

export function useProfileEdit(params: UseProfileEditParams) {
  const {
    updateProfile,
    formData,
    editingProfile,
    setFormData,
    setEditingProfile,
  } = params;

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      bodyWeight: profile.bodyWeight,
    });
  };

  const handleSave = () => {
    if (editingProfile && formData.name.trim()) {
      updateProfile(editingProfile.id, {
        name: formData.name.trim(),
        bodyWeight: formData.bodyWeight,
      });
      setEditingProfile(null);
      setFormData({ name: "" });
    }
  };

  const handleCancel = () => {
    setEditingProfile(null);
    setFormData({ name: "" });
  };

  return {
    handleEdit,
    handleSave,
    handleCancel,
  };
}
