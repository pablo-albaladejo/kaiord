import { targetUnitSchema } from "../../../domain/schemas/target-values";

const createHeartRateZone = (
  type: string,
  low: number,
  high: number
): Record<string, unknown> => ({
  "@_xsi:type": "HeartRate_t",
  HeartRateZone: {
    "@_xsi:type": type,
    ...(type === "PredefinedHeartRateZone_t"
      ? { Number: low }
      : { Low: low, High: high }),
  },
});

export const convertHeartRateZone = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): Record<string, unknown> => {
  if (value.unit === targetUnitSchema.enum.zone) {
    return createHeartRateZone(
      "PredefinedHeartRateZone_t",
      value.value!,
      value.value!
    );
  }

  if (value.unit === targetUnitSchema.enum.range) {
    return createHeartRateZone("CustomHeartRateZone_t", value.min!, value.max!);
  }

  if (value.unit === targetUnitSchema.enum.bpm) {
    return createHeartRateZone(
      "CustomHeartRateZone_t",
      value.value!,
      value.value!
    );
  }

  if (value.unit === targetUnitSchema.enum.percent_max) {
    return createHeartRateZone(
      "CustomHeartRateZone_t",
      value.value!,
      value.value!
    );
  }

  return { "@_xsi:type": "None_t" };
};
