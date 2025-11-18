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

const validateSingleValue = (
  value: number | undefined,
  unit: string
): number => {
  if (value === undefined) {
    throw new Error(`${unit} unit requires value to be defined`);
  }
  return value;
};

const validateRange = (
  min: number | undefined,
  max: number | undefined
): [number, number] => {
  if (min === undefined || max === undefined) {
    throw new Error("range unit requires min and max to be defined");
  }
  return [min, max];
};

export const convertHeartRateZone = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): Record<string, unknown> => {
  if (value.unit === targetUnitSchema.enum.zone) {
    const val = validateSingleValue(value.value, "zone");
    return createHeartRateZone("PredefinedHeartRateZone_t", val, val);
  }

  if (value.unit === targetUnitSchema.enum.range) {
    const [min, max] = validateRange(value.min, value.max);
    return createHeartRateZone("CustomHeartRateZone_t", min, max);
  }

  if (value.unit === targetUnitSchema.enum.bpm) {
    const val = validateSingleValue(value.value, "bpm");
    return createHeartRateZone("CustomHeartRateZone_t", val, val);
  }

  if (value.unit === targetUnitSchema.enum.percent_max) {
    const val = validateSingleValue(value.value, "percent_max");
    return createHeartRateZone("CustomHeartRateZone_t", val, val);
  }

  return { "@_xsi:type": "None_t" };
};
