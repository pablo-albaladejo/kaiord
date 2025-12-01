/**
 * useZoneValidation Hook
 *
 * Zone validation logic.
 */

import type { HeartRateZone, PowerZone } from "../../../../types/profile";

type ZoneValidationError = {
  zone: number;
  message: string;
};

export function useZoneValidation(isPowerZones: boolean) {
  const validateZones = (
    zonesToValidate: Array<PowerZone | HeartRateZone>
  ): Array<ZoneValidationError> => {
    const errors: Array<ZoneValidationError> = [];

    for (let i = 0; i < zonesToValidate.length; i++) {
      const zone = zonesToValidate[i];

      if (isPowerZones && "minPercent" in zone && "maxPercent" in zone) {
        if (zone.minPercent >= zone.maxPercent) {
          errors.push({
            zone: zone.zone,
            message: "Min must be less than max",
          });
        }
      } else if (!isPowerZones && "minBpm" in zone && "maxBpm" in zone) {
        if (zone.minBpm >= zone.maxBpm) {
          errors.push({
            zone: zone.zone,
            message: "Min must be less than max",
          });
        }
      }

      if (i < zonesToValidate.length - 1) {
        const nextZone = zonesToValidate[i + 1];
        if (isPowerZones && "maxPercent" in zone && "minPercent" in nextZone) {
          if (zone.maxPercent >= nextZone.minPercent) {
            errors.push({
              zone: zone.zone,
              message: "Overlaps with next zone",
            });
          }
        } else if (!isPowerZones && "maxBpm" in zone && "minBpm" in nextZone) {
          if (zone.maxBpm >= nextZone.minBpm) {
            errors.push({
              zone: zone.zone,
              message: "Overlaps with next zone",
            });
          }
        }
      }
    }

    return errors;
  };

  return { validateZones };
}
