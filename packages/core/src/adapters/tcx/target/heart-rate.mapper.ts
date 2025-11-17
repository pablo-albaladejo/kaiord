import type { Target } from "../../../domain/schemas/target";

export const mapHeartRateTargetToTcx = (
  target: Target
): Record<string, unknown> => {
  if (target.type !== "heart_rate") {
    return { "@_xsi:type": "None_t" };
  }

  const value = target.value;

  if (value.unit === "zone") {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: value.value,
      },
    };
  }

  if (value.unit === "range") {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: value.min,
        High: value.max,
      },
    };
  }

  if (value.unit === "bpm") {
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
