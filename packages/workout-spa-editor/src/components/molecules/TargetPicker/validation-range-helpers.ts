import type { ValidationResult } from "./validation-types";

export function validateRangeStrings(
  minValue?: string,
  maxValue?: string
): ValidationResult | null {
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

  return null;
}

export function validateRangeNumbers(
  min: number,
  max: number
): ValidationResult | null {
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

  return null;
}
