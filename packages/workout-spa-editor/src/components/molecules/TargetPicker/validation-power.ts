import type { ValidationResult } from "./validation-types";

export const validatePowerTarget = (
  unit: string,
  numericValue: number
): ValidationResult => {
  if (unit === "zone") {
    if (
      !Number.isInteger(numericValue) ||
      numericValue < 1 ||
      numericValue > 7
    ) {
      return {
        isValid: false,
        error: "Power zone must be between 1 and 7",
      };
    }
  } else if (unit === "watts") {
    if (numericValue > 2000) {
      return {
        isValid: false,
        error: "Power cannot exceed 2000 watts",
      };
    }
  } else if (unit === "percent_ftp") {
    if (numericValue > 200) {
      return {
        isValid: false,
        error: "Percentage cannot exceed 200%",
      };
    }
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
