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

// KRD → TCX converters

export type KrdTargetData = {
  target: Target;
  sport?: string;
};

export const convertKrdTargetToTcx = (
  data: KrdTargetData
): Record<string, unknown> => {
  const { target, sport } = data;

  if (target.type === targetTypeSchema.enum.heart_rate) {
    return convertHeartRateTargetToTcx(target);
  }

  if (target.type === targetTypeSchema.enum.pace) {
    return convertPaceTargetToTcx(target);
  }

  if (target.type === targetTypeSchema.enum.cadence) {
    return convertCadenceTargetToTcx(target, sport);
  }

  if (target.type === targetTypeSchema.enum.open) {
    return { "@_xsi:type": "None_t" };
  }

  // Unsupported target types (power, stroke_type) default to None
  return { "@_xsi:type": "None_t" };
};

const convertHeartRateTargetToTcx = (
  target: Target
): Record<string, unknown> => {
  if (target.type !== "heart_rate") {
    return { "@_xsi:type": "None_t" };
  }

  const value = target.value;

  // Heart rate zone (1-5)
  if (value.unit === targetUnitSchema.enum.zone) {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: value.value,
      },
    };
  }

  // Heart rate range (low/high bpm)
  if (value.unit === targetUnitSchema.enum.range) {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: value.min,
        High: value.max,
      },
    };
  }

  // Single bpm value → custom zone with same low/high
  if (value.unit === targetUnitSchema.enum.bpm) {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: value.value,
        High: value.value,
      },
    };
  }

  // Percent max → custom zone (not directly supported, use as-is)
  if (value.unit === targetUnitSchema.enum.percent_max) {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: value.value,
        High: value.value,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};

const convertPaceTargetToTcx = (target: Target): Record<string, unknown> => {
  if (target.type !== "pace") {
    return { "@_xsi:type": "None_t" };
  }

  const value = target.value;

  // Speed zone
  if (value.unit === targetUnitSchema.enum.zone) {
    // TCX doesn't have predefined speed zones, use custom zone
    return {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: value.value,
        HighInMetersPerSecond: value.value,
      },
    };
  }

  // Speed range (low/high m/s)
  if (value.unit === targetUnitSchema.enum.range) {
    return {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: value.min,
        HighInMetersPerSecond: value.max,
      },
    };
  }

  // Single mps value → custom zone with same low/high
  if (value.unit === targetUnitSchema.enum.mps) {
    return {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: value.value,
        HighInMetersPerSecond: value.value,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};

const convertCadenceTargetToTcx = (
  target: Target,
  sport?: string
): Record<string, unknown> => {
  if (target.type !== "cadence") {
    return { "@_xsi:type": "None_t" };
  }

  const value = target.value;
  const isRunning = sport === "running" || sport === "Running";

  // Cadence range (low/high rpm)
  if (value.unit === targetUnitSchema.enum.range) {
    // For running, KRD stores rpm, TCX stores spm (rpm * 2)
    const minCadence = isRunning ? value.min * 2 : value.min;
    const maxCadence = isRunning ? value.max * 2 : value.max;

    return {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: minCadence,
        High: maxCadence,
      },
    };
  }

  // Single rpm value → custom zone with same low/high
  if (value.unit === targetUnitSchema.enum.rpm) {
    const cadenceValue = isRunning ? value.value * 2 : value.value;

    return {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: cadenceValue,
        High: cadenceValue,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};
