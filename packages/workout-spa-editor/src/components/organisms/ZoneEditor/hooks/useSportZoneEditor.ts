/**
 * useSportZoneEditor Hook
 *
 * Manages sport zone editor state and actions.
 */

import { useState } from "react";
import { useProfileStore } from "../../../../store/profile-store";
import { SPORT_ZONE_CAPABILITIES } from "../../../../types/sport-zones";
import type { ZoneType } from "../../../../store/profile-store/types";
import type { SportKey, ZoneMode } from "../../../../types/sport-zones";

export function useSportZoneEditor(profileId: string) {
  const [activeSport, setActiveSport] = useState<SportKey>("cycling");
  const [confirmToggle, setConfirmToggle] = useState<{
    zoneType: ZoneType;
    targetMode: ZoneMode;
  } | null>(null);

  const { updateSportThresholds, toggleZoneMode, getProfile } =
    useProfileStore();
  const profile = getProfile(profileId);

  const sportConfig = profile?.sportZones?.[activeSport];
  const capabilities = SPORT_ZONE_CAPABILITIES[activeSport];

  const handleToggleMode = (zoneType: ZoneType, mode: ZoneMode) => {
    if (mode === "auto" && sportConfig?.[zoneType]?.mode === "manual") {
      setConfirmToggle({ zoneType, targetMode: mode });
      return;
    }
    toggleZoneMode(profileId, activeSport, zoneType, mode);
  };

  const confirmModeSwitch = () => {
    if (!confirmToggle) return;
    toggleZoneMode(
      profileId,
      activeSport,
      confirmToggle.zoneType,
      confirmToggle.targetMode
    );
    setConfirmToggle(null);
  };

  const cancelModeSwitch = () => setConfirmToggle(null);

  return {
    activeSport,
    setActiveSport,
    sportConfig,
    capabilities,
    confirmToggle,
    handleToggleMode,
    confirmModeSwitch,
    cancelModeSwitch,
    updateSportThresholds,
  };
}
