/**
 * useProfileActions Hook
 *
 * Combines all profile actions. After Phase 1B the leaf hooks pull
 * `usePersistence()` directly, so this orchestrator no longer threads
 * Zustand-store actions through its parameter list.
 */

import type { Profile } from "../../../../types/profile";
import type { ProfileFormData } from "../types";
import { useProfileCRUD } from "./useProfileCRUD";
import { useProfileSwitch } from "./useProfileSwitch";

type UseProfileActionsParams = {
  profiles: ReadonlyArray<Profile>;
  formData: ProfileFormData;
  editingProfile: Profile | null;
  setFormData: (data: ProfileFormData) => void;
  setEditingProfile: (profile: Profile | null) => void;
  setDeleteConfirmId: (id: string | null) => void;
  setSwitchNotification: (message: string | null) => void;
};

export function useProfileActions(params: UseProfileActionsParams) {
  const crud = useProfileCRUD({
    formData: params.formData,
    editingProfile: params.editingProfile,
    setFormData: params.setFormData,
    setEditingProfile: params.setEditingProfile,
    setDeleteConfirmId: params.setDeleteConfirmId,
  });

  const switcher = useProfileSwitch({
    profiles: params.profiles,
    setSwitchNotification: params.setSwitchNotification,
  });

  return { ...crud, ...switcher };
}
