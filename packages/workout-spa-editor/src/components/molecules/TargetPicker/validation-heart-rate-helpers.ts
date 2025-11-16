import type { ValidationResult } from "./validation-types";

export function validateHeartRateZone(value: number): ValidationResult | null {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return {
      isValid: false,
      error: "Heart rate zone must be between 1 and 5",
    };
  }
  return null;
}

export function validateHeartRateBpm(value: number): ValidationResult | null {
  if (value > 250) {
    return {
      isValid: false,
      error: "Heart rate cannot exceed 250 BPM",
    };
  }
  return null;
}

export function validateHeartRatePercent(
  value: number
): ValidationResult | null {
  if (value > 100) {
    return {
      isValid: false,
      error: "Percentage cannot exceed 100%",
    };
  }
  return null;
}
