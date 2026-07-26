import { getTranslate, type Translate } from "../../../i18n/use-translate";
import {
  validateHeartRateBpm,
  validateHeartRatePercent,
  validateHeartRateZone,
} from "./validation-heart-rate-helpers";
import type { ValidationResult } from "./validation-types";

export const validateHeartRateTarget = (
  unit: string,
  numericValue: number,
  t: Translate = getTranslate("targets")
): ValidationResult => {
  if (unit === "zone") {
    const error = validateHeartRateZone(numericValue, t);
    if (error) return error;
  } else if (unit === "bpm") {
    const error = validateHeartRateBpm(numericValue, t);
    if (error) return error;
  } else if (unit === "percent_max") {
    const error = validateHeartRatePercent(numericValue, t);
    if (error) return error;
  }

  return {
    isValid: true,
    target: {
      type: "heart_rate",
      value: {
        unit: unit as "bpm" | "zone" | "percent_max",
        value: numericValue,
      },
    },
  };
};

export const validateHeartRateRange = (
  min: number,
  max: number
): ValidationResult => {
  return {
    isValid: true,
    target: {
      type: "heart_rate",
      value: { unit: "range", min, max },
    },
  };
};
