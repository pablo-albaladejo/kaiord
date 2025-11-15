import type { ValidationResult } from "./validation-types";

export const validateHeartRateTarget = (
  unit: string,
  numericValue: number
): ValidationResult => {
  if (unit === "zone") {
    if (
      !Number.isInteger(numericValue) ||
      numericValue < 1 ||
      numericValue > 5
    ) {
      return {
        isValid: false,
        error: "Heart rate zone must be between 1 and 5",
      };
    }
  } else if (unit === "bpm") {
    if (numericValue > 250) {
      return {
        isValid: false,
        error: "Heart rate cannot exceed 250 BPM",
      };
    }
  } else if (unit === "percent_max") {
    if (numericValue > 100) {
      return {
        isValid: false,
        error: "Percentage cannot exceed 100%",
      };
    }
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
