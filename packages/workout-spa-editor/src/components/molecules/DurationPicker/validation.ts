import type { Duration } from "../../../types/krd";

export type ValidationResult = {
  isValid: boolean;
  error?: string;
  duration?: Duration;
};

/**
 * Validates duration value and returns a Duration object if valid
 */
export const validateDurationValue = (
  type: "time" | "distance" | "open",
  value: string
): ValidationResult => {
  if (type === "open") {
    return {
      isValid: true,
      duration: { type: "open" },
    };
  }

  // Check if value is empty
  if (!value || value.trim() === "") {
    return {
      isValid: false,
      error: "Value is required",
    };
  }

  // Parse the numeric value
  const numericValue = Number(value);

  // Check if it's a valid number
  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: "Must be a valid number",
    };
  }

  // Check if it's positive
  if (numericValue <= 0) {
    return {
      isValid: false,
      error: "Must be greater than 0",
    };
  }

  // Check for reasonable limits
  if (type === "time") {
    // Max 24 hours (86400 seconds)
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
  }

  if (type === "distance") {
    // Max 1000 km (1,000,000 meters)
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
  }

  return {
    isValid: false,
    error: "Invalid duration type",
  };
};
