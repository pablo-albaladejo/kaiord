import type { Sport } from "@kaiord/core";

export const convertCadenceToTcx = (
  value: { unit: string; value?: number; min?: number; max?: number },
  sport: Sport
): Record<string, unknown> => {
  // KRD stores cadence in revolutions per minute while TCX expresses running
  // cadence in steps per minute; one revolution is two steps (SPM = 2 x RPM).
  const multiplier = sport === "running" ? 2 : 1;

  if (value.unit === "rpm" && value.value !== undefined) {
    const cadence = value.value * multiplier;
    return {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: cadence,
        High: cadence,
      },
    };
  }

  if (
    value.unit === "range" &&
    value.min !== undefined &&
    value.max !== undefined
  ) {
    return {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: value.min * multiplier,
        High: value.max * multiplier,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};
