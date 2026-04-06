/**
 * useMethodSwitch Hook
 *
 * Manages zone method switch confirmation flow.
 */

import { useState } from "react";

import type { ZoneType } from "../../../../store/profile-store/types";
import type { SportZoneConfig } from "../../../../types/sport-zones";
import { calculateHrZones } from "../../../../utils/calculate-hr-zones";
import { calculatePaceZones } from "../../../../utils/calculate-pace-zones";
import { calculatePowerZones } from "../../../../utils/calculate-power-zones";

type MethodSwitch = { zoneType: ZoneType; method: string } | null;

export function useMethodSwitch(
  sportConfig: SportZoneConfig | undefined,
  onApply: (zoneType: ZoneType, method: string, zones: Array<unknown>) => void
) {
  const [confirmMethod, setConfirmMethod] = useState<MethodSwitch>(null);

  const handleMethodChange = (zoneType: ZoneType, method: string) => {
    const current = sportConfig?.[zoneType];
    if (current?.method === "custom" && current.zones.length > 0) {
      setConfirmMethod({ zoneType, method });
      return;
    }
    applyChange(zoneType, method);
  };

  const applyChange = (zoneType: ZoneType, method: string) => {
    if (method === "custom") {
      onApply(zoneType, method, sportConfig?.[zoneType]?.zones ?? []);
      return;
    }

    const t = sportConfig?.thresholds;
    let zones: Array<unknown> = [];

    if (zoneType === "heartRateZones") {
      if (!t?.lthr) return;
      zones = calculateHrZones(t.lthr, method);
    } else if (zoneType === "powerZones") {
      zones = calculatePowerZones(method);
    } else if (zoneType === "paceZones") {
      if (!t?.thresholdPace || !t?.paceUnit) return;
      zones = calculatePaceZones(t.thresholdPace, t.paceUnit, method);
    }

    onApply(zoneType, method, zones);
  };

  const confirmMethodSwitch = () => {
    if (!confirmMethod) return;
    applyChange(confirmMethod.zoneType, confirmMethod.method);
    setConfirmMethod(null);
  };

  const cancelMethodSwitch = () => setConfirmMethod(null);

  return {
    confirmMethod,
    handleMethodChange,
    confirmMethodSwitch,
    cancelMethodSwitch,
  };
}
