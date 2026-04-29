/**
 * useProfileSwitch Hook
 *
 * Profile switching with notification. Reads the profiles list via the
 * live hook and dispatches `setActiveProfile` use case via
 * `usePersistence`; surfaces failures through the toast context.
 */

import { setActiveProfile } from "../../../../application/profile/set-active-profile";
import { usePersistence } from "../../../../contexts/persistence-context";
import { useToastContext } from "../../../../contexts/ToastContext";
import type { Profile } from "../../../../types/profile";

type UseProfileSwitchParams = {
  profiles: ReadonlyArray<Profile>;
  setSwitchNotification: (message: string | null) => void;
};

const TOAST_ERROR = "Failed to switch profile — please retry.";

export function useProfileSwitch(params: UseProfileSwitchParams) {
  const { profiles, setSwitchNotification } = params;
  const persistence = usePersistence();
  const toast = useToastContext();

  const handleSwitchProfile = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    void (async () => {
      try {
        await setActiveProfile(persistence, profileId);
        setSwitchNotification(`Switched to profile: ${profile.name}`);
        setTimeout(() => setSwitchNotification(null), 3000);
      } catch {
        toast.error(TOAST_ERROR);
      }
    })();
  };

  return { handleSwitchProfile };
}
