import type { WorkoutStep } from "@kaiord/core";

export const convertHeartRateToTcx = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): Record<string, unknown> => {
  if (value.unit === "zone") {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: value.value,
      },
    };
  }

  if (value.unit === "bpm" || value.unit === "range") {
    const min = "min" in value ? value.min : value.value;
    const max = "max" in value ? value.max : value.value;
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: min,
        High: max,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};

export const convertPaceToTcx = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): Record<string, unknown> => {
  if (value.unit === "meters_per_second" || value.unit === "range") {
    const min = "min" in value ? value.min : value.value;
    const max = "max" in value ? value.max : value.value;
    return {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: min,
        HighInMetersPerSecond: max,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};

export const convertCadenceToTcx = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): Record<string, unknown> => {
  if (value.unit === "rpm" || value.unit === "range") {
    const min = "min" in value ? value.min : value.value;
    const max = "max" in value ? value.max : value.value;
    return {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: min,
        High: max,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};

const NONE_TCX = { "@_xsi:type": "None_t" };

const convertTargetValueToTcx = (
  type: string,
  value: { unit: string; value?: number; min?: number; max?: number }
): Record<string, unknown> => {
  if (type === "heart_rate") return convertHeartRateToTcx(value);
  if (type === "pace") return convertPaceToTcx(value);
  if (type === "cadence") return convertCadenceToTcx(value);
  return NONE_TCX;
};

export const convertTargetToTcx = (
  step: WorkoutStep
): Record<string, unknown> => {
  const { target } = step;
  if (target.type === "open" || target.type === "stroke_type") return NONE_TCX;
  if (!("value" in target) || !target.value) return NONE_TCX;
  return convertTargetValueToTcx(target.type, target.value);
};
