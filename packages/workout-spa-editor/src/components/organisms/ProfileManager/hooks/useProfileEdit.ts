/**
 * useProfileEdit Hook
 *
 * Profile editing. Reads/writes via the application use case
 * `updateProfile`; surfaces failures through the toast context so the
 * user sees a clear error indication when persistence rejects (e.g.,
 * Dexie quota exceeded).
 */

import { updateProfile } from "../../../../application/profile/update-profile";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import type { Profile } from "../../../../types/profile";
import type { ProfileFormData } from "../types";

type UseProfileEditParams = {
  formData: ProfileFormData;
  editingProfile: Profile | null;
  setFormData: (data: ProfileFormData) => void;
  setEditingProfile: (profile: Profile | null) => void;
};

const TOAST_ERROR = "Failed to save profile — please retry.";

export function useProfileEdit(params: UseProfileEditParams) {
  const { formData, editingProfile, setFormData, setEditingProfile } = params;
  const persistence = usePersistence();
  const toast = useToastContext();

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      bodyWeight: profile.bodyWeight,
      height: profile.height,
      birthDate: profile.birthDate,
      sex: profile.sex,
      restingHeartRate: profile.restingHeartRate,
      activityLevel: profile.activityLevel,
    });
  };

  const handleSave = (overrideData?: ProfileFormData) => {
    const data = overrideData ?? formData;
    if (!editingProfile || !data.name.trim()) return;
    void (async () => {
      try {
        await updateProfile(persistence, editingProfile.id, {
          name: data.name.trim(),
          bodyWeight: data.bodyWeight,
          height: data.height,
          birthDate: data.birthDate,
          sex: data.sex,
          restingHeartRate: data.restingHeartRate,
          activityLevel: data.activityLevel,
        });
        setEditingProfile(null);
        setFormData({ name: "" });
      } catch {
        toast.error(TOAST_ERROR);
      }
    })();
  };

  const handleCancel = () => {
    setEditingProfile(null);
    setFormData({ name: "" });
  };

  return { handleEdit, handleSave, handleCancel };
}
