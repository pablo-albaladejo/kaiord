/**
 * useZoneEditor Hook
 *
 * Manages state and logic for the zone editor component.
 */

import { useState } from "react";
import type {
  HeartRateZone,
  PowerZone,
  Profile,
} from "../../../../types/profile";
import { useZoneValidation } from "./useZoneValidation";

type ZoneValidationError = {
  zone: number;
  message: string;
};

export function useZoneEditor(
  profile: Profile,
  zoneType: "power" | "heartRate",
  onSave: (zones: Array<PowerZone> | Array<HeartRateZone>) => void
) {
  const isPowerZones = zoneType === "power";
  const initialZones = isPowerZones
    ? profile.powerZones
    : profile.heartRateZones;

  const [zones, setZones] = useState<Array<PowerZone> | Array<HeartRateZone>>(
    initialZones
  );
  const [validationErrors, setValidationErrors] = useState<
    Array<ZoneValidationError>
  >([]);

  const { validateZones } = useZoneValidation(isPowerZones);

  const handleZoneChange = (
    zoneIndex: number,
    field: "name" | "minPercent" | "maxPercent" | "minBpm" | "maxBpm",
    value: string | number
  ) => {
    const updatedZones = [...zones];
    const zone = updatedZones[zoneIndex];

    if (field === "name") {
      zone.name = value as string;
    } else if (
      isPowerZones &&
      (field === "minPercent" || field === "maxPercent")
    ) {
      (zone as PowerZone)[field] = Number(value);
    } else if (!isPowerZones && (field === "minBpm" || field === "maxBpm")) {
      (zone as HeartRateZone)[field] = Number(value);
    }

    setZones(updatedZones as Array<PowerZone> | Array<HeartRateZone>);
    setValidationErrors(
      validateZones(updatedZones as Array<PowerZone | HeartRateZone>)
    );
  };

  const handleSave = () => {
    const errors = validateZones(zones as Array<PowerZone | HeartRateZone>);
    if (errors.length === 0) {
      onSave(zones);
    } else {
      setValidationErrors(errors);
    }
  };

  return {
    zones,
    validationErrors,
    isPowerZones,
    handleZoneChange,
    handleSave,
  };
}
