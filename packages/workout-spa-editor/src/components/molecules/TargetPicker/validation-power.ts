import { getTranslate, type Translate } from "../../../i18n/use-translate";
import {
  validatePowerPercent,
  validatePowerWatts,
  validatePowerZone,
} from "./validation-power-helpers";
import type { ValidationResult } from "./validation-types";

export const validatePowerTarget = (
  unit: string,
  numericValue: number,
  t: Translate = getTranslate("targets")
): ValidationResult => {
  if (unit === "zone") {
    const error = validatePowerZone(numericValue, t);
    if (error) return error;
  } else if (unit === "watts") {
    const error = validatePowerWatts(numericValue, t);
    if (error) return error;
  } else if (unit === "percent_ftp") {
    const error = validatePowerPercent(numericValue, t);
    if (error) return error;
  }

  return {
    isValid: true,
    target: {
      type: "power",
      value: {
        unit: unit as "watts" | "percent_ftp" | "zone",
        value: numericValue,
      },
    },
  };
};

export const validatePowerRange = (
  min: number,
  max: number
): ValidationResult => {
  return {
    isValid: true,
    target: {
      type: "power",
      value: { unit: "range", min, max },
    },
  };
};
