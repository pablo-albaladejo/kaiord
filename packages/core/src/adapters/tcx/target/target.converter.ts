import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
import { targetUnitSchema } from "../../../domain/schemas/target-values";
import { tcxTargetTypeSchema } from "../schemas/tcx-target";

export type TcxTargetData = {
  targetType?: string;
  // Heart rate fields
  heartRateZone?: number;
  heartRateLow?: number;
  heartRateHigh?: number;
  // Speed fields
  speedZone?: number;
  speedLow?: number;
  speedHigh?: number;
  // Cadence fields
  cadenceLow?: number;
  cadenceHigh?: number;
  // Sport context for cadence conversion
  sport?: string;
};

export const convertTcxTarget = (data: TcxTargetData): Target => {
  if (data.targetType === tcxTargetTypeSchema.enum.HeartRate) {
    return convertHeartRateTarget(data);
  }

  if (data.targetType === tcxTargetTypeSchema.enum.Speed) {
    return convertSpeedTarget(data);
  }

  if (data.targetType === tcxTargetTypeSchema.enum.Cadence) {
    return convertCadenceTarget(data);
  }

  return { type: targetTypeSchema.enum.open };
};

const convertHeartRateTarget = (data: TcxTargetData): Target => {
  // Heart rate zone (1-5)
  if (data.heartRateZone !== undefined) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: targetUnitSchema.enum.zone,
        value: data.heartRateZone,
      },
    };
  }

  // Heart rate range (low/high bpm)
  if (data.heartRateLow !== undefined && data.heartRateHigh !== undefined) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.heartRateLow,
        max: data.heartRateHigh,
      },
    };
  }

  return { type: targetTypeSchema.enum.open };
};

const convertSpeedTarget = (data: TcxTargetData): Target => {
  // Speed zone
  if (data.speedZone !== undefined) {
    return {
      type: targetTypeSchema.enum.pace,
      value: {
        unit: targetUnitSchema.enum.zone,
        value: data.speedZone,
      },
    };
  }

  // Speed range (low/high m/s)
  if (data.speedLow !== undefined && data.speedHigh !== undefined) {
    return {
      type: targetTypeSchema.enum.pace,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.speedLow,
        max: data.speedHigh,
      },
    };
  }

  return { type: targetTypeSchema.enum.open };
};

const convertCadenceTarget = (data: TcxTargetData): Target => {
  // Cadence range (low/high rpm)
  if (data.cadenceLow !== undefined && data.cadenceHigh !== undefined) {
    // For running, TCX stores steps per minute, KRD stores rpm (spm/2)
    const isRunning = data.sport === "running" || data.sport === "Running";
    const minRpm = isRunning ? data.cadenceLow / 2 : data.cadenceLow;
    const maxRpm = isRunning ? data.cadenceHigh / 2 : data.cadenceHigh;

    return {
      type: targetTypeSchema.enum.cadence,
      value: {
        unit: targetUnitSchema.enum.range,
        min: minRpm,
        max: maxRpm,
      },
    };
  }

  return { type: targetTypeSchema.enum.open };
};
