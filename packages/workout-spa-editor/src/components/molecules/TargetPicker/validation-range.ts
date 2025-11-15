import { validateHeartRateRange } from "./validation-heart-rate";
import {
  validateCadenceRange,
  validatePaceRange,
} from "./validation-pace-cadence";
import { validatePowerRange } from "./validation-power";
import type { ValidationResult } from "./validation-types";

export const validateRangeInput = (
  type: "power" | "heart_rate" | "pace" | "cadence" | "open",
  minValue?: string,
  maxValue?: string
): ValidationResult => {
  const minStr = String(minValue || "");
  const maxStr = String(maxValue || "");

  if (!minStr || minStr.trim() === "") {
    return {
      isValid: false,
      error: "Minimum value is required",
    };
  }

  if (!maxStr || maxStr.trim() === "") {
    return {
      isValid: false,
      error: "Maximum value is required",
    };
  }

  const min = Number(minStr);
  const max = Number(maxStr);

  if (isNaN(min) || isNaN(max)) {
    return {
      isValid: false,
      error: "Values must be valid numbers",
    };
  }

  if (min <= 0 || max <= 0) {
    return {
      isValid: false,
      error: "Values must be greater than 0",
    };
  }

  if (min >= max) {
    return {
      isValid: false,
      error: "Minimum must be less than maximum",
    };
  }

  if (type === "power") {
    return validatePowerRange(min, max);
  }

  if (type === "heart_rate") {
    return validateHeartRateRange(min, max);
  }

  if (type === "pace") {
    return validatePaceRange(min, max);
  }

  if (type === "cadence") {
    return validateCadenceRange(min, max);
  }

  return {
    isValid: false,
    error: "Invalid target type",
  };
};
