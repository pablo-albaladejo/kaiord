import { type Logger, type Target, targetTypeSchema } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";

import { convertPowerValue, interpretWorkoutPower } from "./power-helpers";
import type { FitTargetData } from "./target.types";

// FIT defines 7 power zones. If the zone field is out of range,
// reinterpret it as an absolute value (FIT overloads the zone field).
const POWER_ZONE_MAX = 7;

export const convertPowerTarget = (
  data: FitTargetData,
  logger?: Logger
): Target => {
  const rangeTarget = buildPowerRangeTarget(data, logger);
  if (rangeTarget) return rangeTarget;

  const zoneTarget = buildPowerZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  if (data.targetValue !== undefined) {
    const powerValue = convertPowerValue(data.targetValue);
    if (powerValue) {
      return {
        type: targetTypeSchema.enum.power,
        value: powerValue,
      };
    }
  }

  return { type: targetTypeSchema.enum.open };
};

const buildRange = (low: number, high: number, logger?: Logger): Target => {
  const min = interpretWorkoutPower(low);
  const max = interpretWorkoutPower(high);
  const percent = min.type === "percentage" && max.type === "percentage";
  if (min.type !== max.type) {
    logger?.warn("Power range mixes %FTP and watts bounds", { low, high });
  }
  return {
    type: targetTypeSchema.enum.power,
    value: {
      unit: targetUnitSchema.enum.range,
      min: min.value,
      max: max.value,
      ...(percent && { basis: targetUnitSchema.enum.percent_ftp }),
    },
  };
};

const buildPowerRangeTarget = (
  data: FitTargetData,
  logger?: Logger
): Target | null => {
  if (
    data.customTargetPowerLow !== undefined &&
    data.customTargetPowerHigh !== undefined
  ) {
    return buildRange(
      data.customTargetPowerLow,
      data.customTargetPowerHigh,
      logger
    );
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return buildRange(
      data.customTargetValueLow,
      data.customTargetValueHigh,
      logger
    );
  }

  return null;
};

const buildPowerZoneTarget = (data: FitTargetData): Target | null => {
  if (data.targetPowerZone !== undefined) {
    if (data.targetPowerZone >= 1 && data.targetPowerZone <= POWER_ZONE_MAX) {
      return {
        type: targetTypeSchema.enum.power,
        value: {
          unit: targetUnitSchema.enum.zone,
          value: data.targetPowerZone,
        },
      };
    }
    const powerValue = convertPowerValue(data.targetPowerZone);
    if (powerValue) {
      return { type: targetTypeSchema.enum.power, value: powerValue };
    }
  }
  return null;
};
