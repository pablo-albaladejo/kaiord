/**
 * useSportZoneEditor Hook
 *
 * Manages sport zone editor state and actions. Reads the watched profile
 * via `useProfileByIdLive` (Dexie + useLiveQuery) and dispatches every
 * write through the application use cases injected via `usePersistence`
 * — see `useSportZoneEditorActions`. Errors propagate as toasts so the
 * user sees a clear failure indication when persistence rejects.
 */

import { useState } from "react";

import type { ZoneType } from "../../../../application/profile/zones/zone-types";
import { useProfileByIdLive } from "../../../../hooks/use-profile-by-id-live";
import type { SportKey } from "../../../../types/sport-zones";
import { SPORT_ZONE_CAPABILITIES } from "../../../../types/sport-zones";
import { buildDefaultZone } from "../utils/default-zone";
import { useMethodSwitch } from "./useMethodSwitch";
import { useSportZoneEditorActions } from "./useSportZoneEditorActions";

export function useSportZoneEditor(profileId: string) {
  const [activeSport, setActiveSport] = useState<SportKey>("cycling");
  const profile = useProfileByIdLive(profileId);
  const sportConfig = profile?.sportZones?.[activeSport];
  const capabilities = SPORT_ZONE_CAPABILITIES[activeSport];
  const actions = useSportZoneEditorActions(profileId, activeSport);

  const methodSwitch = useMethodSwitch(sportConfig, actions.applyMethod);

  const handleAddZone = (zoneType: ZoneType) => {
    const current = sportConfig?.[zoneType];
    const nextNum = (current?.zones.length ?? 0) + 1;
    const zone = buildDefaultZone(zoneType, nextNum);
    actions.handleAddCustom(zoneType, zone);
  };

  return {
    activeSport,
    setActiveSport,
    sportConfig,
    capabilities,
    confirmMethod: methodSwitch.confirmMethod,
    handleMethodChange: methodSwitch.handleMethodChange,
    confirmMethodSwitch: methodSwitch.confirmMethodSwitch,
    cancelMethodSwitch: methodSwitch.cancelMethodSwitch,
    updateSportThresholds: actions.handleUpdateThresholds,
    handleZonesChange: actions.handleZonesChange,
    handleAddZone,
  };
}
