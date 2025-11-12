import {
  targetTypeEnum,
  targetUnitEnum,
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

  return { type: targetTypeEnum.enum.open };
};

const buildPowerRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetPowerLow !== undefined &&
    data.customTargetPowerHigh !== undefined
  ) {
    return {
      type: targetTypeEnum.enum.power,
      value: {
        unit: targetUnitEnum.enum.range,
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
      type: targetTypeEnum.enum.power,
      value: {
        unit: targetUnitEnum.enum.range,
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
      type: targetTypeEnum.enum.power,
      value: {
        unit: targetUnitEnum.enum.zone,
        value: data.targetPowerZone,
      },
    };
  }
  return null;
};

const convertPowerValue = (value: number): Target => {
  if (value > 1000) {
    return {
      type: targetTypeEnum.enum.power,
      value: {
        unit: targetUnitEnum.enum.percent_ftp,
        value: value - 1000,
      },
    };
  }

  if (value > 0) {
    return {
      type: targetTypeEnum.enum.power,
      value: {
        unit: targetUnitEnum.enum.watts,
        value,
      },
    };
  }

  return { type: targetTypeEnum.enum.open };
};
