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

export type CreateFormData = { name: string };

type UseProfileCreateParams = {
  formData: CreateFormData;
  setFormData: (data: CreateFormData) => void;
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
        await createProfile(persistence, formData.name.trim());
        setFormData({ name: "" });
      } catch {
        toast.error(t("athletes.toast.createFailed"));
      }
    })();
  };

  return { handleCreate };
}
