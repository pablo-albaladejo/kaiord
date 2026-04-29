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
import type { ProfileFormData } from "../types";

type UseProfileCreateParams = {
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
};

const TOAST_ERROR = "Failed to create profile — please retry.";

export function useProfileCreate(params: UseProfileCreateParams) {
  const { formData, setFormData } = params;
  const persistence = usePersistence();
  const toast = useToastContext();

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    void (async () => {
      try {
        await createProfile(persistence, formData.name.trim(), {
          bodyWeight: formData.bodyWeight,
        });
        setFormData({ name: "" });
      } catch {
        toast.error(TOAST_ERROR);
      }
    })();
  };

  return { handleCreate };
}
