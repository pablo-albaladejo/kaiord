/**
 * useProfileSwitch Hook
 *
 * Makes a profile active through the `setActiveProfile` use case. On
 * success it hands the translated "Active athlete: …" message to
 * `onSwitched`, when given, for the caller to show or announce; failures
 * surface through the toast context.
 */

import { setActiveProfile } from "../application/profile/set-active-profile";
import { usePersistence } from "../contexts/persistence-context";
import { useToastContext } from "../contexts/ToastContext";
import { useTranslate } from "../i18n/use-translate";
import type { Profile } from "../types/profile";

type UseProfileSwitchParams = {
  profiles: ReadonlyArray<Profile>;
  onSwitched?: (message: string) => void;
};

export function useProfileSwitch(params: UseProfileSwitchParams) {
  const { profiles, onSwitched } = params;
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("athlete");

  const handleSwitchProfile = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    void (async () => {
      try {
        await setActiveProfile(persistence, profileId);
        onSwitched?.(t("athletes.toast.switched", { name: profile.name }));
      } catch {
        toast.error(t("athletes.toast.switchFailed"));
      }
    })();
  };

  return { handleSwitchProfile };
}
