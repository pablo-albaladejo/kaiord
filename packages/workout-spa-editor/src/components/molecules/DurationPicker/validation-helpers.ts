import type { ValidationResult } from "./validation";

export const validateNumericInput = (value: string): ValidationResult => {
  if (!value || value.trim() === "") {
    return {
      isValid: false,
      error: "Value is required",
    };
  }

  const numericValue = Number(value);

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: "Must be a valid number",
    };
  }

  if (numericValue <= 0) {
    return {
      isValid: false,
      error: "Must be greater than 0",
    };
  }

  return { isValid: true };
};

export const validateTimeDuration = (
  numericValue: number
): ValidationResult => {
  if (numericValue > 86400) {
    return {
      isValid: false,
      error: "Duration cannot exceed 24 hours (86400 seconds)",
    };
  }

  return {
    isValid: true,
    duration: {
      type: "time",
      seconds: numericValue,
    },
  };
};

export const validateDistanceDuration = (
  numericValue: number
): ValidationResult => {
  if (numericValue > 1000000) {
    return {
      isValid: false,
      error: "Distance cannot exceed 1000 km (1,000,000 meters)",
    };
  }

  return {
    isValid: true,
    duration: {
      type: "distance",
      meters: numericValue,
    },
  };
};
