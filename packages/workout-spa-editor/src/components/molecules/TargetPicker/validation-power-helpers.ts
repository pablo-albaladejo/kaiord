import type { ValidationResult } from "./validation-types";

export function validatePowerZone(value: number): ValidationResult | null {
  if (!Number.isInteger(value) || value < 1 || value > 7) {
    return {
      isValid: false,
      error: "Power zone must be between 1 and 7",
    };
  }
  return null;
}

export function validatePowerWatts(value: number): ValidationResult | null {
  if (value > 2000) {
    return {
      isValid: false,
      error: "Power cannot exceed 2000 watts",
    };
  }
  return null;
}

export function validatePowerPercent(value: number): ValidationResult | null {
  if (value > 200) {
    return {
      isValid: false,
      error: "Percentage cannot exceed 200%",
    };
  }
  return null;
}
