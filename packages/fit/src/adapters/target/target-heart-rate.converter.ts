import { type Target, targetTypeSchema } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";

import { interpretWorkoutHeartRate } from "./heart-rate-helpers";
import type { FitTargetData } from "./target.types";

// FIT defines 5 heart-rate zones. If the zone field is out of range,
// reinterpret it as an absolute value (FIT overloads the zone field).
const HR_ZONE_MAX = 5;

export const convertHeartRateTarget = (data: FitTargetData): Target => {
  const rangeTarget = buildHeartRateRangeTarget(data);
  if (rangeTarget) return rangeTarget;

  const zoneTarget = buildHeartRateZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  if (data.targetValue !== undefined) {
    return convertHeartRateValue(data.targetValue);
  }

  return { type: targetTypeSchema.enum.open };
};

const buildHeartRateRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetHeartRateLow !== undefined &&
    data.customTargetHeartRateHigh !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.customTargetHeartRateLow,
        max: data.customTargetHeartRateHigh,
      },
    };
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.customTargetValueLow,
        max: data.customTargetValueHigh,
      },
    };
  }

  return null;
};

const buildHeartRateZoneTarget = (data: FitTargetData): Target | null => {
  if (data.targetHrZone !== undefined) {
    if (data.targetHrZone >= 1 && data.targetHrZone <= HR_ZONE_MAX) {
      return {
        type: targetTypeSchema.enum.heart_rate,
        value: {
          unit: targetUnitSchema.enum.zone,
          value: data.targetHrZone,
        },
      };
    }
    // Out of zone range, reinterpret as an absolute value.
    return convertHeartRateValue(data.targetHrZone);
  }
  return null;
};

const convertHeartRateValue = (value: number): Target => {
  if (value <= 0) {
    return { type: targetTypeSchema.enum.open };
  }
  // FIT absolute-bpm offset rule lives in heart-rate-helpers.ts.
  const interpreted = interpretWorkoutHeartRate(value);
  return {
    type: targetTypeSchema.enum.heart_rate,
    value: {
      unit:
        interpreted.type === "bpm"
          ? targetUnitSchema.enum.bpm
          : targetUnitSchema.enum.percent_max,
      value: interpreted.value,
    },
  };
};
