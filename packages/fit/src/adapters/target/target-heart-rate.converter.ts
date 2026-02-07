import { targetTypeSchema, type Target } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";
import type { FitTargetData } from "./target.types";

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
    // Validate zone is in valid range (1-5)
    // If not, treat as BPM value instead
    if (data.targetHrZone >= 1 && data.targetHrZone <= 5) {
      return {
        type: targetTypeSchema.enum.heart_rate,
        value: {
          unit: targetUnitSchema.enum.zone,
          value: data.targetHrZone,
        },
      };
    }
    // Invalid zone value, treat as BPM
    return convertHeartRateValue(data.targetHrZone);
  }
  return null;
};

const convertHeartRateValue = (value: number): Target => {
  // Garmin FIT encoding:
  // - Values > 100: Absolute bpm (offset by 100)
  // - Values 0-100: Percentage of max HR
  if (value > 100) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: targetUnitSchema.enum.bpm,
        value: value - 100,
      },
    };
  }

  if (value > 0) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: targetUnitSchema.enum.percent_max,
        value,
      },
    };
  }

  return { type: targetTypeSchema.enum.open };
};
