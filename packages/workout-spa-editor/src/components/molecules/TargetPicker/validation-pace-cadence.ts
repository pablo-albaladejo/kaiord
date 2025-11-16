import type { ValidationResult } from "./validation-types";

export const validatePaceTarget = (
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
        error: "Pace zone must be between 1 and 5",
      };
    }
  } else if (unit === "mps") {
    if (numericValue > 20) {
      return {
        isValid: false,
        error: "Pace cannot exceed 20 m/s",
      };
    }
  }

  return {
    isValid: true,
    target: {
      type: "pace",
      value: { unit: unit as "mps" | "zone", value: numericValue },
    },
  };
};

export const validatePaceRange = (
  min: number,
  max: number
): ValidationResult => {
  return {
    isValid: true,
    target: {
      type: "pace",
      value: { unit: "range", min, max },
    },
  };
};

export const validateCadenceTarget = (
  unit: string,
  numericValue: number
): ValidationResult => {
  if (unit === "rpm") {
    if (numericValue > 300) {
      return {
        isValid: false,
        error: "Cadence cannot exceed 300 RPM",
      };
    }
  }

  return {
    isValid: true,
    target: {
      type: "cadence",
      value: { unit: "rpm", value: numericValue },
    },
  };
};

export const validateCadenceRange = (
  min: number,
  max: number
): ValidationResult => {
  return {
    isValid: true,
    target: {
      type: "cadence",
      value: { unit: "range", min, max },
    },
  };
};
