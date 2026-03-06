/**
 * useSportZoneEditor Hook
 *
 * Manages sport zone editor state and actions.
 */

import { useState } from "react";
import { useMethodSwitch } from "./useMethodSwitch";
import { useProfileStore } from "../../../../store/profile-store";
import { SPORT_ZONE_CAPABILITIES } from "../../../../types/sport-zones";
import { buildDefaultZone } from "../utils/default-zone";
import type { ZoneType } from "../../../../store/profile-store/types";
import type { SportKey } from "../../../../types/sport-zones";

export function useSportZoneEditor(profileId: string) {
  const [activeSport, setActiveSport] = useState<SportKey>("cycling");
  const store = useProfileStore();
  const profile = store.getProfile(profileId);
  const sportConfig = profile?.sportZones?.[activeSport];
  const capabilities = SPORT_ZONE_CAPABILITIES[activeSport];

  const {
    confirmMethod,
    handleMethodChange,
    confirmMethodSwitch,
    cancelMethodSwitch,
  } = useMethodSwitch(sportConfig, (zoneType, method, zones) => {
    store.setZoneMethod(profileId, activeSport, zoneType, method, zones);
  });

  const handleZonesChange = (zoneType: ZoneType, zones: Array<unknown>) => {
    store.updateSportZones(profileId, activeSport, zoneType, zones);
  };

  const handleAddZone = (zoneType: ZoneType) => {
    const current = sportConfig?.[zoneType];
    const nextNum = (current?.zones.length ?? 0) + 1;
    const zone = buildDefaultZone(zoneType, nextNum);
    store.addCustomZone(profileId, activeSport, zoneType, zone);
  };

  return {
    activeSport,
    setActiveSport,
    sportConfig,
    capabilities,
    confirmMethod,
    handleMethodChange,
    confirmMethodSwitch,
    cancelMethodSwitch,
    updateSportThresholds: store.updateSportThresholds,
    handleZonesChange,
    handleAddZone,
  };
}
