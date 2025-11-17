import { targetUnitSchema } from "../../../domain/schemas/target-values";

export const convertHeartRateZone = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): Record<string, unknown> => {
  if (value.unit === targetUnitSchema.enum.zone) {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: value.value,
      },
    };
  }

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
