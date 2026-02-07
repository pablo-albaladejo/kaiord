import {
  validateDistanceDuration,
  validateNumericInput,
  validateTimeDuration,
} from "./validation-helpers";
import type { Duration } from "../../../types/krd";

export type ValidationResult = {
  isValid: boolean;
  error?: string;
  duration?: Duration;
};

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

  const inputValidation = validateNumericInput(value);
  if (!inputValidation.isValid) {
    return inputValidation;
  }

  const numericValue = Number(value);

  if (type === "time") {
    return validateTimeDuration(numericValue);
  }

  if (type === "distance") {
    return validateDistanceDuration(numericValue);
  }

  return {
    isValid: false,
    error: "Invalid duration type",
  };
};
