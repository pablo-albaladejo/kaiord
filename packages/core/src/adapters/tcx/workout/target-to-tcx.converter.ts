import type { WorkoutStep } from "../../../domain/schemas/workout";

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

export const convertTargetToTcx = (
  step: WorkoutStep
): Record<string, unknown> => {
  if (step.target.type === "open") {
    return { "@_xsi:type": "None_t" };
  }

  if (step.target.type === "heart_rate") {
    const value = step.target.value;
    if (value && "unit" in value) {
      return convertHeartRateToTcx(value);
    }
  }

  if (step.target.type === "pace") {
    const value = step.target.value;
    if (value && "unit" in value) {
      return convertPaceToTcx(value);
    }
  }

  if (step.target.type === "cadence") {
    const value = step.target.value;
    if (value && "unit" in value) {
      return convertCadenceToTcx(value);
    }
  }

  return { "@_xsi:type": "None_t" };
};
