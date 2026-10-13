/**
 * useProfileCreate Hook
 *
 * Profile creation. Calls the `createProfile` application use case via
 * `usePersistence()`; surfaces persistence rejections through the toast
 * context so the user sees a clear failure indication.
 */

import { createProfile } from "../../../../application/profile/create-profile";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useTranslate } from "../../../../i18n/use-translate";
import type { ProfileFormData } from "../types";

type UseProfileCreateParams = {
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
};

export function useProfileCreate(params: UseProfileCreateParams) {
  const { formData, setFormData } = params;
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("athlete");

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    void (async () => {
      try {
        await createProfile(persistence, formData.name.trim(), {
          bodyWeight: formData.bodyWeight,
        });
        setFormData({ name: "" });
      } catch {
        toast.error(t("profileManager.toast.createFailed"));
      }
    })();
  };

  return { handleCreate };
}
