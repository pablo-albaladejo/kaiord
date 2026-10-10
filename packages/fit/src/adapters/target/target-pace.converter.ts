import { type Target, targetTypeSchema } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";

import type { FitTargetData } from "./target.types";

// FIT defines 5 speed/pace zones. If the zone field is out of range,
// reinterpret it as an absolute value (FIT overloads the zone field).
const PACE_ZONE_MAX = 5;

export const convertPaceTarget = (data: FitTargetData): Target => {
  const rangeTarget = buildPaceRangeTarget(data);
  if (rangeTarget) return rangeTarget;

  const zoneTarget = buildPaceZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  const valueTarget = buildPaceValueTarget(data);
  if (valueTarget) return valueTarget;

  return { type: targetTypeSchema.enum.open };
};

// The writer encodes a single mps value as a custom range with
// low === high (FIT has no single-value custom field), so an equal
// range reads back as the single value it was written from.
const buildRange = (min: number, max: number): Target => ({
  type: targetTypeSchema.enum.pace,
  value:
    min === max
      ? { unit: targetUnitSchema.enum.mps, value: min }
      : { unit: targetUnitSchema.enum.range, min, max },
});

const buildPaceRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetSpeedLow !== undefined &&
    data.customTargetSpeedHigh !== undefined
  ) {
    return buildRange(data.customTargetSpeedLow, data.customTargetSpeedHigh);
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return buildRange(data.customTargetValueLow, data.customTargetValueHigh);
  }

  return null;
};

const buildPaceZoneTarget = (data: FitTargetData): Target | null => {
  if (data.targetSpeedZone !== undefined) {
    if (data.targetSpeedZone >= 1 && data.targetSpeedZone <= PACE_ZONE_MAX) {
      return {
        type: targetTypeSchema.enum.pace,
        value: {
          unit: targetUnitSchema.enum.zone,
          value: data.targetSpeedZone,
        },
      };
    }
    if (data.targetSpeedZone > 0) {
      return {
        type: targetTypeSchema.enum.pace,
        value: {
          unit: targetUnitSchema.enum.mps,
          value: data.targetSpeedZone,
        },
      };
    }
  }
  return null;
};

const buildPaceValueTarget = (data: FitTargetData): Target | null => {
  if (data.targetValue !== undefined) {
    return {
      type: targetTypeSchema.enum.pace,
      value: {
        unit: targetUnitSchema.enum.mps,
        value: data.targetValue,
      },
    };
  }
  return null;
};
