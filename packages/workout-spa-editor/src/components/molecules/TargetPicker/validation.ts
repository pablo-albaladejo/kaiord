import { validateHeartRateTarget } from "./validation-heart-rate";
import { validateValueString } from "./validation-helpers";
import {
  validateCadenceTarget,
  validatePaceTarget,
} from "./validation-pace-cadence";
import { validatePowerTarget } from "./validation-power";
import { validateRangeInput } from "./validation-range";
import type { ValidationResult } from "./validation-types";

export type { ValidationResult } from "./validation-types";

export const validateTargetValue = (
  type: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  value: string,
  minValue?: string,
  maxValue?: string
): ValidationResult => {
  if (type === "open") {
    return {
      isValid: true,
      target: { type: "open" },
    };
  }

  if (unit === "range") {
    return validateRangeInput(type, minValue, maxValue);
  }

  const valueError = validateValueString(value);
  if (valueError) return valueError;

  const numericValue = Number(value);

  if (type === "power") return validatePowerTarget(unit, numericValue);
  if (type === "heart_rate") return validateHeartRateTarget(unit, numericValue);
  if (type === "pace") return validatePaceTarget(unit, numericValue);
  if (type === "cadence") return validateCadenceTarget(unit, numericValue);

  return {
    isValid: false,
    error: "Invalid target type",
  };
};
