import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
import { targetUnitSchema } from "../../../domain/schemas/target-values";
import { tcxTargetTypeSchema } from "../schemas/tcx-target";

export type TcxTargetData = {
  targetType?: string;
  heartRateZone?: number;
  heartRateLow?: number;
  heartRateHigh?: number;
  speedZone?: number;
  speedLow?: number;
  speedHigh?: number;
  cadenceLow?: number;
  cadenceHigh?: number;
  sport?: string;
};

const convertHeartRateTarget = (data: TcxTargetData): Target => {
  if (data.heartRateZone !== undefined) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: targetUnitSchema.enum.zone,
        value: data.heartRateZone,
      },
    };
  }

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
  if (data.speedZone !== undefined) {
    return {
      type: targetTypeSchema.enum.pace,
      value: {
        unit: targetUnitSchema.enum.zone,
        value: data.speedZone,
      },
    };
  }

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

/**
 * Converts TCX cadence target to KRD cadence target.
 *
 * Running cadence conversion: TCX uses SPM (steps per minute) for running,
 * but KRD standardizes on RPM (revolutions per minute). For running,
 * SPM = 2 * RPM because each revolution (stride) consists of two steps
 * (left + right foot). Therefore: RPM = SPM / 2
 */
const convertCadenceTarget = (data: TcxTargetData): Target => {
  if (data.cadenceLow !== undefined && data.cadenceHigh !== undefined) {
    const isRunning = data.sport === "running" || data.sport === "Running";
    // Convert SPM to RPM for running (SPM = 2 * RPM, so RPM = SPM / 2)
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
