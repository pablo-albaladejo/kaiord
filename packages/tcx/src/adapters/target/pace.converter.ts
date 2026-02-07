import { targetUnitSchema } from "@kaiord/core";

export const convertPaceTargetToTcx = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): Record<string, unknown> => {
  if (value.unit === targetUnitSchema.enum.zone) {
    return {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: value.value,
        HighInMetersPerSecond: value.value,
      },
    };
  }

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
