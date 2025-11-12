import {
  targetTypeEnum,
  targetUnitEnum,
  type Target,
} from "../../domain/schemas/target";
import { FIT_TARGET_TYPE } from "./constants";

export type FitTargetData = {
  targetType?: string;
  targetValue?: number;
  targetPowerZone?: number;
  targetHrZone?: number;
  targetCadenceZone?: number;
  targetSpeedZone?: number;
  customTargetValueLow?: number;
  customTargetValueHigh?: number;
  customTargetPowerLow?: number;
  customTargetPowerHigh?: number;
  customTargetHeartRateLow?: number;
  customTargetHeartRateHigh?: number;
  customTargetCadenceLow?: number;
  customTargetCadenceHigh?: number;
  customTargetSpeedLow?: number;
  customTargetSpeedHigh?: number;
};

export const convertFitTarget = (data: FitTargetData): Target => {
  if (data.targetType === FIT_TARGET_TYPE.POWER) {
    return convertPowerTarget(data);
  }

  if (data.targetType === FIT_TARGET_TYPE.HEART_RATE) {
    return convertHeartRateTarget(data);
  }

  if (data.targetType === FIT_TARGET_TYPE.CADENCE) {
    return convertCadenceTarget(data);
  }

  if (data.targetType === FIT_TARGET_TYPE.SPEED) {
    return convertPaceTarget(data);
  }

  return { type: targetTypeEnum.enum.open };
};

const convertPowerTarget = (data: FitTargetData): Target => {
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

  if (data.targetPowerZone !== undefined) {
    return {
      type: targetTypeEnum.enum.power,
      value: {
        unit: targetUnitEnum.enum.zone,
        value: data.targetPowerZone,
      },
    };
  }

  if (data.targetValue !== undefined) {
    const value = data.targetValue;
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
  }

  return { type: targetTypeEnum.enum.open };
};

const convertHeartRateTarget = (data: FitTargetData): Target => {
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

  if (data.targetHrZone !== undefined) {
    return {
      type: targetTypeEnum.enum.heart_rate,
      value: {
        unit: targetUnitEnum.enum.zone,
        value: data.targetHrZone,
      },
    };
  }

  if (data.targetValue !== undefined) {
    const value = data.targetValue;
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
  }

  return { type: targetTypeEnum.enum.open };
};

const convertCadenceTarget = (data: FitTargetData): Target => {
  if (
    data.customTargetCadenceLow !== undefined &&
    data.customTargetCadenceHigh !== undefined
  ) {
    return {
      type: targetTypeEnum.enum.cadence,
      value: {
        unit: targetUnitEnum.enum.range,
        min: data.customTargetCadenceLow,
        max: data.customTargetCadenceHigh,
      },
    };
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return {
      type: targetTypeEnum.enum.cadence,
      value: {
        unit: targetUnitEnum.enum.range,
        min: data.customTargetValueLow,
        max: data.customTargetValueHigh,
      },
    };
  }

  if (data.targetCadenceZone !== undefined) {
    return {
      type: targetTypeEnum.enum.cadence,
      value: {
        unit: targetUnitEnum.enum.rpm,
        value: data.targetCadenceZone,
      },
    };
  }

  if (data.targetValue !== undefined) {
    return {
      type: targetTypeEnum.enum.cadence,
      value: {
        unit: targetUnitEnum.enum.rpm,
        value: data.targetValue,
      },
    };
  }

  return { type: targetTypeEnum.enum.open };
};

const convertPaceTarget = (data: FitTargetData): Target => {
  if (
    data.customTargetSpeedLow !== undefined &&
    data.customTargetSpeedHigh !== undefined
  ) {
    return {
      type: targetTypeEnum.enum.pace,
      value: {
        unit: targetUnitEnum.enum.range,
        min: data.customTargetSpeedLow,
        max: data.customTargetSpeedHigh,
      },
    };
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return {
      type: targetTypeEnum.enum.pace,
      value: {
        unit: targetUnitEnum.enum.range,
        min: data.customTargetValueLow,
        max: data.customTargetValueHigh,
      },
    };
  }

  if (data.targetSpeedZone !== undefined) {
    return {
      type: targetTypeEnum.enum.pace,
      value: {
        unit: targetUnitEnum.enum.zone,
        value: data.targetSpeedZone,
      },
    };
  }

  if (data.targetValue !== undefined) {
    return {
      type: targetTypeEnum.enum.pace,
      value: {
        unit: targetUnitEnum.enum.mps,
        value: data.targetValue,
      },
    };
  }

  return { type: targetTypeEnum.enum.open };
};
