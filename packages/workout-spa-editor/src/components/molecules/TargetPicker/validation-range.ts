import { getTranslate, type Translate } from "../../../i18n/use-translate";
import { validateHeartRateRange } from "./validation-heart-rate";
import {
  validateCadenceRange,
  validatePaceRange,
} from "./validation-pace-cadence";
import { validatePowerRange } from "./validation-power";
import {
  validateRangeNumbers,
  validateRangeStrings,
} from "./validation-range-helpers";
import type { ValidationResult } from "./validation-types";

export const validateRangeInput = (
  type: "power" | "heart_rate" | "pace" | "cadence" | "open",
  minValue?: string,
  maxValue?: string,
  t: Translate = getTranslate("targets")
): ValidationResult => {
  const stringError = validateRangeStrings(minValue, maxValue, t);
  if (stringError) return stringError;

  const min = Number(minValue);
  const max = Number(maxValue);

  const numberError = validateRangeNumbers(min, max, t);
  if (numberError) return numberError;

  if (type === "power") return validatePowerRange(min, max);
  if (type === "heart_rate") return validateHeartRateRange(min, max);
  if (type === "pace") return validatePaceRange(min, max);
  if (type === "cadence") return validateCadenceRange(min, max);

  return {
    isValid: false,
    error: t("validation.invalidTargetType"),
  };
};
