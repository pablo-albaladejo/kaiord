import { updateProfile } from "../application/profile/update-profile";
import { usePersistence } from "../contexts/persistence-context";
import { useToastContext } from "../contexts/ToastContext";
import { useTranslate } from "../i18n/use-translate";

/**
 * Renames an athlete, from the Athletes list or the Athlete page's name.
 * A blank name is refused rather than saved; a failed write toasts. Resolves
 * whether the name was saved.
 */
export function useRenameAthlete() {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("athlete");

  return async (profileId: string, name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    try {
      await updateProfile(persistence, profileId, { name: trimmed });
      return true;
    } catch {
      toast.error(t("athletes.toast.saveFailed"));
      return false;
    }
  };
}
