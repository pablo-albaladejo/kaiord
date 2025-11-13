import {
  targetTypeSchema,
  targetUnitSchema,
  type Target,
} from "../../../domain/schemas/target";
import type { FitTargetData } from "./target.types";

export const convertPowerTarget = (data: FitTargetData): Target => {
  const rangeTarget = buildPowerRangeTarget(data);
  if (rangeTarget) return rangeTarget;

  const zoneTarget = buildPowerZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  if (data.targetValue !== undefined) {
    return convertPowerValue(data.targetValue);
  }

  return { type: targetTypeSchema.enum.open };
};

const buildPowerRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetPowerLow !== undefined &&
    data.customTargetPowerHigh !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.customTargetPowerLow,
        max: data.customTargetPowerHigh,
      },
    };
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.customTargetValueLow,
        max: data.customTargetValueHigh,
      },
    };
  }

  return null;
};

const buildPowerZoneTarget = (data: FitTargetData): Target | null => {
  if (data.targetPowerZone !== undefined) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: targetUnitSchema.enum.zone,
        value: data.targetPowerZone,
      },
    };
  }
  return null;
};

const convertPowerValue = (value: number): Target => {
  // Garmin FIT encoding:
  // - Values > 1000: Absolute watts (offset by 1000)
  // - Values 0-1000: Percentage of FTP
  if (value > 1000) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: targetUnitSchema.enum.watts,
        value: value - 1000,
      },
    };
  }

  if (value > 0) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: targetUnitSchema.enum.percent_ftp,
        value,
      },
    };
  }

  return { type: targetTypeSchema.enum.open };
};
