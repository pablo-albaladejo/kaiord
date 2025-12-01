/**
 * useProfileSwitch Hook
 *
 * Profile switching with notification.
 */

import type { Profile } from "../../../../types/profile";

type UseProfileSwitchParams = {
  setActiveProfile: (id: string) => void;
  profiles: Array<Profile>;
  setSwitchNotification: (message: string | null) => void;
};

export function useProfileSwitch(params: UseProfileSwitchParams) {
  const { setActiveProfile, profiles, setSwitchNotification } = params;

  const handleSwitchProfile = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setActiveProfile(profileId);
      setSwitchNotification(`Switched to profile: ${profile.name}`);
      setTimeout(() => setSwitchNotification(null), 3000);
    }
  };

  return {
    handleSwitchProfile,
  };
}
