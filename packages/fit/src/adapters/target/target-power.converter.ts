import { targetTypeSchema, type Target } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";
import { convertPowerValue, interpretWorkoutPower } from "./power-helpers";
import type { FitTargetData } from "./target.types";

export const convertPowerTarget = (data: FitTargetData): Target => {
  const rangeTarget = buildPowerRangeTarget(data);
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

const buildPowerRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetPowerLow !== undefined &&
    data.customTargetPowerHigh !== undefined
  ) {
    const minValue = interpretWorkoutPower(data.customTargetPowerLow);
    const maxValue = interpretWorkoutPower(data.customTargetPowerHigh);

    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: targetUnitSchema.enum.range,
        min: minValue.value,
        max: maxValue.value,
      },
    };
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    const minValue = interpretWorkoutPower(data.customTargetValueLow);
    const maxValue = interpretWorkoutPower(data.customTargetValueHigh);

    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: targetUnitSchema.enum.range,
        min: minValue.value,
        max: maxValue.value,
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
