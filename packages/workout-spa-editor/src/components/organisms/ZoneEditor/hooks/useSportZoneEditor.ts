/**
 * useSportZoneEditor Hook
 *
 * Manages sport zone editor state and actions.
 */

import { useState } from "react";
import { useProfileStore } from "../../../../store/profile-store";
import { SPORT_ZONE_CAPABILITIES } from "../../../../types/sport-zones";
import { calculateHrZones } from "../../../../utils/calculate-hr-zones";
import { calculatePaceZones } from "../../../../utils/calculate-pace-zones";
import { calculatePowerZones } from "../../../../utils/calculate-power-zones";
import type { ZoneType } from "../../../../store/profile-store/types";
import type { SportKey } from "../../../../types/sport-zones";

export function useSportZoneEditor(profileId: string) {
  const [activeSport, setActiveSport] = useState<SportKey>("cycling");
  const [confirmMethod, setConfirmMethod] = useState<{
    zoneType: ZoneType;
    method: string;
  } | null>(null);

  const { updateSportThresholds, setZoneMethod, getProfile } =
    useProfileStore();
  const profile = getProfile(profileId);

  const sportConfig = profile?.sportZones?.[activeSport];
  const capabilities = SPORT_ZONE_CAPABILITIES[activeSport];

  const handleMethodChange = (zoneType: ZoneType, method: string) => {
    const current = sportConfig?.[zoneType];
    if (current?.method === "custom" && current.zones.length > 0) {
      setConfirmMethod({ zoneType, method });
      return;
    }
    applyMethodChange(zoneType, method);
  };

  const applyMethodChange = (zoneType: ZoneType, method: string) => {
    const t = sportConfig?.thresholds;
    let zones: Array<unknown> = [];

    if (zoneType === "heartRateZones" && t?.lthr) {
      zones = calculateHrZones(t.lthr, method);
    } else if (zoneType === "powerZones") {
      zones = calculatePowerZones(t?.ftp, method);
    } else if (zoneType === "paceZones" && t?.thresholdPace && t?.paceUnit) {
      zones = calculatePaceZones(t.thresholdPace, t.paceUnit, method);
    }

    setZoneMethod(profileId, activeSport, zoneType, method, zones);
  };

  const confirmMethodSwitch = () => {
    if (!confirmMethod) return;
    applyMethodChange(confirmMethod.zoneType, confirmMethod.method);
    setConfirmMethod(null);
  };

  const cancelMethodSwitch = () => setConfirmMethod(null);

  return {
    activeSport,
    setActiveSport,
    sportConfig,
    capabilities,
    confirmMethod,
    handleMethodChange,
    confirmMethodSwitch,
    cancelMethodSwitch,
    updateSportThresholds,
  };
}
