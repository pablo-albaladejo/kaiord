/**
 * useProfileCreate Hook
 *
 * Profile creation logic.
 */

type ProfileFormData = {
  name: string;
  bodyWeight?: number;
  ftp?: number;
  maxHeartRate?: number;
};

type UseProfileCreateParams = {
  createProfile: (
    name: string,
    data: {
      bodyWeight?: number;
      ftp?: number;
      maxHeartRate?: number;
    }
  ) => void;
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
};

export function useProfileCreate(params: UseProfileCreateParams) {
  const { createProfile, formData, setFormData } = params;

  const handleCreate = () => {
    if (formData.name.trim()) {
      createProfile(formData.name.trim(), {
        bodyWeight: formData.bodyWeight,
        ftp: formData.ftp,
        maxHeartRate: formData.maxHeartRate,
      });
      setFormData({ name: "" });
    }
  };

  return {
    handleCreate,
  };
}
