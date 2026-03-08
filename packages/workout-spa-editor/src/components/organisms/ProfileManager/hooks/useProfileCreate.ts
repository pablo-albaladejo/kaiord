/**
 * useProfileCreate Hook
 *
 * Profile creation logic.
 */

import type { ProfileFormData } from "../types";

type UseProfileCreateParams = {
  createProfile: (name: string, data: { bodyWeight?: number }) => void;
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
};

export function useProfileCreate(params: UseProfileCreateParams) {
  const { createProfile, formData, setFormData } = params;

  const handleCreate = () => {
    if (formData.name.trim()) {
      createProfile(formData.name.trim(), {
        bodyWeight: formData.bodyWeight,
      });
      setFormData({ name: "" });
    }
  };

  return {
    handleCreate,
  };
}
