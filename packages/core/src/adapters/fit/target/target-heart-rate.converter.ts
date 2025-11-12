import {
  targetTypeEnum,
  targetUnitEnum,
  type Target,
} from "../../../domain/schemas/target";
import type { FitTargetData } from "./target.types";

export const convertHeartRateTarget = (data: FitTargetData): Target => {
  const rangeTarget = buildHeartRateRangeTarget(data);
  if (rangeTarget) return rangeTarget;

  const zoneTarget = buildHeartRateZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  if (data.targetValue !== undefined) {
    return convertHeartRateValue(data.targetValue);
  }

  return { type: targetTypeEnum.enum.open };
};

const buildHeartRateRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetHeartRateLow !== undefined &&
    data.customTargetHeartRateHigh !== undefined
  ) {
    return {
      type: targetTypeEnum.enum.heart_rate,
      value: {
        unit: targetUnitEnum.enum.range,
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
      type: targetTypeEnum.enum.heart_rate,
      value: {
        unit: targetUnitEnum.enum.range,
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
        type: targetTypeEnum.enum.heart_rate,
        value: {
          unit: targetUnitEnum.enum.zone,
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
  if (value > 100 && value <= 200) {
    return {
      type: targetTypeEnum.enum.heart_rate,
      value: {
        unit: targetUnitEnum.enum.percent_max,
        value,
      },
    };
  }

  if (value > 0 && value <= 300) {
    return {
      type: targetTypeEnum.enum.heart_rate,
      value: {
        unit: targetUnitEnum.enum.bpm,
        value,
      },
    };
  }

  return { type: targetTypeEnum.enum.open };
};
