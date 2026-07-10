/**
 * useZoneValidation Hook
 *
 * Zone validation logic.
 */

import type { HeartRateZone, PowerZone } from "../../../../types/profile";

export type ZoneValidationError = {
  zone: number;
  code: "min-max" | "overlap";
};

export function useZoneValidation(isPowerZones: boolean) {
  const validateZones = (
    zonesToValidate: Array<PowerZone | HeartRateZone>
  ): Array<ZoneValidationError> => {
    const errors: Array<ZoneValidationError> = [];

    for (let i = 0; i < zonesToValidate.length; i++) {
      const zone = zonesToValidate[i]!;

      if (isPowerZones && "minPercent" in zone && "maxPercent" in zone) {
        if (zone.minPercent >= zone.maxPercent) {
          errors.push({ zone: zone.zone, code: "min-max" });
        }
      } else if (!isPowerZones && "minBpm" in zone && "maxBpm" in zone) {
        if (zone.minBpm >= zone.maxBpm) {
          errors.push({ zone: zone.zone, code: "min-max" });
        }
      }

      if (i < zonesToValidate.length - 1) {
        const nextZone = zonesToValidate[i + 1]!;
        if (isPowerZones && "maxPercent" in zone && "minPercent" in nextZone) {
          if (zone.maxPercent >= nextZone.minPercent) {
            errors.push({ zone: zone.zone, code: "overlap" });
          }
        } else if (!isPowerZones && "maxBpm" in zone && "minBpm" in nextZone) {
          if (zone.maxBpm >= nextZone.minBpm) {
            errors.push({ zone: zone.zone, code: "overlap" });
          }
        }
      }
    }

    return errors;
  };

  return { validateZones };
}
