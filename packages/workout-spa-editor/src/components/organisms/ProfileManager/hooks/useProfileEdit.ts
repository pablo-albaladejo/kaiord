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
import { useTranslate } from "../../../../i18n/use-translate";
import type { Profile } from "../../../../types/profile";
import type { ProfileFormData } from "../types";

type UseProfileEditParams = {
  formData: ProfileFormData;
  editingProfile: Profile | null;
  setFormData: (data: ProfileFormData) => void;
  setEditingProfile: (profile: Profile | null) => void;
};

export function useProfileEdit(params: UseProfileEditParams) {
  const { formData, editingProfile, setFormData, setEditingProfile } = params;
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("athlete");

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

  // Persist in place: editing fields (name in the header, physiology in the
  // Personal Data tab) auto-save as the user types/selects WITHOUT exiting edit
  // mode. The edit view is left only via "Back to List" (handleCancel); by then
  // every change is already saved, so no explicit "Save & close" is needed.
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
      } catch {
        toast.error(t("profileManager.toast.saveFailed"));
      }
    })();
  };

  const handleCancel = () => {
    setEditingProfile(null);
    setFormData({ name: "" });
  };

  return { handleEdit, handleSave, handleCancel };
}
