import { targetUnitSchema } from "../../../domain/schemas/target-values";

export const convertCadenceTargetToTcx = (
  value: { unit: string; value?: number; min?: number; max?: number },
  sport?: string
): Record<string, unknown> => {
  const isRunning = sport === "running" || sport === "Running";

  if (value.unit === targetUnitSchema.enum.range) {
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
